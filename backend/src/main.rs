use std::fs;

use actix_web::{http, middleware::Logger, web::{self, Data}, App, HttpServer};
use dotenv::dotenv;
use sqlx::{postgres::PgPoolOptions, Pool, Postgres};
use actix_cors::Cors;

mod handlers;

pub struct AppState {
    db: Pool<Postgres>,
}

async fn create_user_table(pool: &Pool<Postgres>) -> Result<(), std::io::Error> {
    sqlx::query(r#"CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            session_id VARCHAR(255) UNIQUE 
            );"#,
            )
        .execute(pool)
        .await
        .expect("Error, table exists");

    Ok(())
}

async fn create_bucket_table(pool: &Pool<Postgres>) -> Result<(), std::io::Error> {
    sqlx::query(r#"CREATE TABLE IF NOT EXISTS bucket (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            bucket_name VARCHAR(64) NOT NULL,
            access_key_id VARCHAR(64),
            secret_key VARCHAR(64)
            );"#,
            )
        .execute(pool)
        .await
        .expect("Error, table exists");

    Ok(())
}

async fn create_blob_table(pool: &Pool<Postgres>) -> Result<(), std::io::Error> {
    sqlx::query(r#"CREATE TABLE IF NOT EXISTS blob (
            id SERIAL PRIMARY KEY,
            bucket_id INTEGER REFERENCES bucket(id),
            path TEXT NOT NULL,
            file TEXT NOT NULL,
            content_type TEXT NOT NULL,
            size BIGINT NOT NULL,
            created_on TIMESTAMP NOT NULL,
            updated_on TIMESTAMP NOT NULL
            )"#,
            )
        .execute(pool)
        .await
        .expect("Error, table exists");

    Ok(())
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    //std::env::set_var("RUST_LOG", "actix_web=debug");
    if std::env::var_os("RUST_LOG").is_none() {
        std::env::set_var("RUST_LOG", "actix_web=info");
    }
    env_logger::init();

    let allowed_origin = std::env::var("ALLOWED_ORIGIN").expect("ALLOWED_ORIGIN must be set");
    let max_age = 3600;

    let base_dir = std::env::current_dir().unwrap();
    let parent_dir = String::from(base_dir.parent().unwrap().to_string_lossy());
    let media_url = std::env::var("MEDIA_URL").expect("MEDIA_URL must be set");
    let media_folder = parent_dir + &media_url;
    match fs::create_dir(media_folder) {
        Ok(_) => println!("Created media folder"),
        Err(_) => println!("Media folder already exist"),
    };

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Error building a connection pool");

    // Create table if not exist
    create_user_table(&pool).await.expect("Table 'users' could not be created");
    create_bucket_table(&pool).await.expect("Table 'bucket' could not be created");
    create_blob_table(&pool).await.expect("Table 'bucket' could not be created");
    
    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin(&allowed_origin)
            .allowed_methods(vec!["GET", "POST", "DELETE"])
            .allowed_headers(vec![http::header::AUTHORIZATION, http::header::ACCEPT, http::header::ORIGIN, http::header::COOKIE, http::header::ACCESS_CONTROL_ALLOW_ORIGIN])
            .allowed_header(http::header::CONTENT_TYPE)
            .max_age(max_age)
            .supports_credentials();

        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .app_data(Data::new(AppState{ db: pool.clone() }))
            .route("/users", web::get().to(handlers::get_users))
            .route("/users/{id}", web::get().to(handlers::get_user_by_id))
            .route("/user/{username}", web::get().to(handlers::get_user_by_username))
            .route("/api/user/{email}", web::get().to(handlers::get_userid_by_email))
            .route("/users", web::post().to(handlers::add_user))
            .route("/users/{id}", web::delete().to(handlers::delete_user))
            .route("/create_bucket", web::post().to(handlers::create_bucket))
            .route("/delete_bucket", web::delete().to(handlers::delete_bucket))
            .route("/get_buckets/{id}", web::get().to(handlers::get_buckets))
            .route("/get_bucketid/{user_id}/{bucketname}", web::get().to(handlers::get_bucketid))
            .route("/api/upload_image", web::post().to(handlers::upload_images))
            .route("/login", web::post().to(handlers::login))
            .route("/auth", web::post().to(handlers::auth))
            .route("/signout", web::post().to(handlers::signout))
    })
    .bind("127.0.0.1:8080")?
        .run()
        .await
}
