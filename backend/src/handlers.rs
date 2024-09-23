use std::{str, fs, io::Write, io::Error as IoError};

use actix_multipart::Multipart;
use actix_web::{cookie::{Cookie, SameSite}, web::{self, Data, Json, Path}, HttpResponse, Responder};
use chrono::{DateTime, Utc};
use dotenv::dotenv;
use rand::{distributions::Alphanumeric, Rng};
use serde::{Serialize, Deserialize};
use sqlx::{self, FromRow};
use crate::AppState;
use argonautica::{Hasher, Verifier};
use futures::{StreamExt, TryStreamExt};
use std::path::Path as p;

use std::iter;

#[derive(Deserialize)]
pub struct UploadImage {
    path: String,
    type_: String,
    size: i32,
    bucket_id: i32,
    create_on: DateTime<Utc>,
    updated_on: DateTime<Utc>
}

#[derive(Serialize, FromRow)]
struct SingleUser {
    id: i32,
    username: String,
    email: String,
    session_id: String
}

#[derive(Serialize, FromRow)]
struct UserID {
    id: i32
}

#[derive(Serialize, FromRow)]
struct User {
    id: i32,
    username: String,
    password: String,
    email: String
}

#[derive(Deserialize)]
pub struct CreateUserBody {
    username: String,
    password: String,
    email: String
}

#[derive(Serialize, FromRow)]
pub struct Bucket {
    id: i32,
    user_id: i32,
    bucket_name: String,
    access_key_id: String,
    secret_key: String
}


#[derive(Deserialize)]
pub struct CreateBucket {
    user_id: i32,
    bucket_name: String,
    username: String
}

#[derive(Deserialize)]
pub struct DeleteBucket {
    user_id: i32,
    bucket_name: String
}

#[derive(Deserialize)]
pub struct Profile {
    user_id: i32,
    username: String,
    email: String
}

#[derive(Deserialize)]
pub struct Login {
    email: String,
    password: Option<String>
}

#[derive(Deserialize)]
pub struct AuthInfo {
    user_id: i32,
    session_id: String
}

#[derive(Serialize, FromRow)]
pub struct BasicBucketInfo {
    id: i32
}

fn generate_random_string(length: usize) -> String {
    iter::repeat(())
        .map(|()| rand::thread_rng().sample(Alphanumeric))
        .map(char::from)
        .take(length)
        .collect()
}

pub async fn get_bucketid(state: Data<AppState>, path: Path<(i32, String)>) -> impl Responder {
    let (user_id, bucketname) = path.into_inner();
    match sqlx::query_as::<_, BasicBucketInfo>("SELECT id FROM bucket WHERE user_id = $1 AND bucket_name = $2")
        .bind(user_id)
        .bind(bucketname)
        .fetch_one(&state.db)
        .await    
    {
        Ok(bucket_id) => HttpResponse::Ok().json(bucket_id),
        Err(_) => HttpResponse::NotFound().json("No bucket found"),
    }
}

pub async fn get_users(state: Data<AppState>) -> impl Responder {
    //format!("Hello from get users")
    match sqlx::query_as::<_, User>("SELECT id, username, password, email FROM users")
        .fetch_all(&state.db)
        .await
    {
        Ok(users) => HttpResponse::Ok().json(users),
        Err(_) => HttpResponse::NotFound().json("No users found"),
    }
}

pub async fn get_user_by_id(state: Data<AppState>, path: Path<i32>) -> impl Responder {
    //format!("hello from get users by id")
    let id: i32 = path.into_inner();
    match sqlx::query_as::<_, SingleUser>("SELECT id, username, email, session_id FROM users WHERE id = $1")
        .bind(id)
        .fetch_one(&state.db)
        .await
    {
        Ok(user) => HttpResponse::Ok().json(user),
        Err(_) => HttpResponse::NotFound().json("User not found"),
    }
}

pub async fn get_user_by_username(state: Data<AppState>, path: Path<String>) -> impl Responder {
    //format!("Hello {}", path)
    let name: String = path.into_inner();
    match sqlx::query_as::<_, SingleUser>("SELECT id, username, email, session_id FROM users WHERE username = $1")
        .bind(name)
        .fetch_one(&state.db)
        .await
    {
        Ok(user) => HttpResponse::Ok().json(user),
        Err(_) => HttpResponse::NotFound().json("Username not found"),
    }
}

pub async fn get_userid_by_email(state: Data<AppState>, path: Path<String>) -> impl Responder {
    let email: String = path.into_inner();
    match sqlx::query_as::<_, UserID>("SELECT id FROM users WHERE email = $1")
        .bind(email)
        .fetch_one(&state.db)
        .await
        {
            Ok(user_id) => HttpResponse::Ok().json(user_id),
            Err(_) => HttpResponse::NotFound().json("User ID not found"),
        }
}

pub async fn add_user(state: Data<AppState>, body: Json<CreateUserBody>) -> impl Responder {
    //format!("hello from add user")
    let user: CreateUserBody = body.into_inner();

    let hash_secret = std::env::var("HASH_SECRET").expect("HASH_SECRET must be set!");
    let mut hasher = Hasher::default();
    let hash = hasher
        .with_password(user.password)
        .with_secret_key(hash_secret)
        .hash()
        .unwrap();

    match sqlx::query_as::<_, User>(
        "INSERT INTO users (username, password, email)                    
        VALUES ($1, $2, $3)                                      
        RETURNING id, username, password, email"
        )
        .bind(user.username)
        .bind(hash)
        .bind(user.email)
        .fetch_one(&state.db)
        .await
    {
        Ok(user) => {
            dotenv().ok();
            // find parent dir
            let base_dir = std::env::current_dir().unwrap();
            let parent_dir = String::from(base_dir.parent().unwrap().to_string_lossy());

            let media_url = std::env::var("MEDIA_URL").expect("MEDIA_URL must be set");
            // create folder for user
            let user_folder = parent_dir + &media_url + &user.username + "/";
            // don't panic if folder already exists
            match fs::create_dir(&user_folder) { 
                Ok(_) => println!("Creating {user_folder}"),
                Err(_) => println!("{user_folder} already exists"),
            }
            HttpResponse::Ok().json(user)
        },
        Err(error) => {
            HttpResponse::InternalServerError().json(format!("{:?}", error))
        },
    }
}

pub async fn delete_user(state: Data<AppState>, path: Path<i32>) -> impl Responder {
    //format!("hello from delete user")
    let id: i32 = path.into_inner();

    match sqlx::query_as::<_, User>(
        "DELETE FROM users 
        WHERE id = $1
        RETURNING id, username, password, email"
        )
        .bind(id)
        .fetch_one(&state.db)
        .await
        {
            Ok(user) => {
                dotenv().ok();

                // find dir
                let base_dir = std::env::current_dir().unwrap();
                let parent_dir = String::from(base_dir.parent().unwrap().to_string_lossy());

                let media_url = std::env::var("MEDIA_URL").expect("MEDIA_URL must be set");
                // create folder for user
                let user_folder = parent_dir + &media_url + &user.username;
                match fs::remove_dir_all(&user_folder) {
                    Ok(_) => println!("Removing {user_folder}"),
                    Err(_) => println!("Folder does not exist"),
                }

                HttpResponse::Ok().json(user)
            },
            Err(_) => {
                HttpResponse::NotFound().json("User not found")
            },
        }
}

pub async fn upload_images(mut payload: Multipart) -> impl Responder {

    let mut username = String::new();
    let mut bucketname = String::new();

    while let Some(item) = payload.next().await {

        if let Ok(mut field) = item {
            let content_disposition = field.content_disposition();
            let name = content_disposition.get_name().unwrap_or_default().to_string();

            if name == "username" {
                while let Some(chunk) = field.next().await {
                    if let Ok(data) = chunk {
                        username.push_str(str::from_utf8(&data).unwrap());
                    }
                }
            } else if name == "bucketname" {
                while let Some(chunk) = field.next().await {
                    if let Ok(data) = chunk {
                        bucketname.push_str(str::from_utf8(&data).unwrap());
                    }
                }
            } else if name == "inpFile" {
                let filename = content_disposition.get_filename().unwrap_or("upload");
                let filepath = format!("./../media/{username}/{bucketname}/{}", sanitize_filename::sanitize(&filename));
                //let final_path = format!("./../media/{username}/{bucketname}/{}", sanitize_filename::sanitize(&filename));

                fs::create_dir_all(p::new(&filepath).parent().unwrap()).unwrap();

                let file = web::block(move || fs::File::create(&filepath)).await.unwrap().unwrap();

                let mut f = file;

                while let Some(chunk) = field.next().await {
                    match chunk {
                        Ok(data) => {
                            f = web::block(move || {
                                let mut file = f;
                                match file.write_all(&data) {
                                    Ok(_) => Ok(file),
                                    Err(e) => Err(IoError::new(e.kind(), format!("Write error: {}", e))),
                                }
                            }).await.unwrap().unwrap();
                        }
                        Err(_) => {
                            //println!("Error while reading chunk: {:?}", e);
                            return HttpResponse::InternalServerError().body("Error while reading chunk");
                        }
                    }
                }

                //println!("File saved to: {}", final_path);
            }
        } else {
            //println!("Error while processing field");
            return HttpResponse::InternalServerError().body("Error while processing field");
        }
    }
    
    //println!("Username: {}", username);
    //println!("Bucketname: {}", bucketname);

    HttpResponse::Ok().body("Upload Complete")
}

pub async fn create_bucket(state: Data<AppState>, body: Json<CreateBucket>) -> impl Responder {
    //format!("Hello");
    let bucket: CreateBucket = body.into_inner();
    let access_key_id = generate_random_string(16);
    let secret_key = generate_random_string(32);
    let username = bucket.username;

    match sqlx::query_as::<_, Bucket>(
        "INSERT INTO bucket (user_id, bucket_name, access_key_id, secret_key)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id, bucket_name, access_key_id, secret_key"
        )
        .bind(bucket.user_id)
        .bind(bucket.bucket_name)
        .bind(access_key_id)
        .bind(secret_key)
        .fetch_one(&state.db)
        .await
        {
            Ok(bucket) => {
                dotenv().ok();

                // find dir
                let base_dir = std::env::current_dir().unwrap();
                let parent_dir = String::from(base_dir.parent().unwrap().to_string_lossy());

                let media_url = std::env::var("MEDIA_URL").expect("MEDIA_URL must be set");
                // create folder for user
                let bucket_folder = parent_dir + &media_url + &username + "/" + &bucket.bucket_name;
                
                match fs::create_dir(&bucket_folder) { 
                    Ok(_) => println!("Creating {bucket_folder}"),
                    Err(_) => println!("{bucket_folder} already exists"),
                }

                HttpResponse::Ok().json(bucket)
            },
            Err(error) => HttpResponse::InternalServerError().json(format!("{:?}", error))
        }
}

pub async fn delete_bucket(state: Data<AppState>, path: Json<DeleteBucket>) -> impl Responder {
    let bucket_info: DeleteBucket = path.into_inner();
    let user_id: i32 = bucket_info.user_id;
    let bucket_name: String = bucket_info.bucket_name;

    match sqlx::query_as::<_, Bucket>(
        "DELETE FROM bucket 
        WHERE user_id = $1 
        AND bucket_name = $2
        RETURNING id, user_id, bucket_name, access_key_id, secret_key"
        )
        .bind(&user_id)
        .bind(&bucket_name)
        .fetch_one(&state.db)
        .await
        {
            Ok(bucket) => HttpResponse::Ok().json(bucket),
            Err(_) => HttpResponse::NotFound().json("No bucket to delete"),
        }

}

pub async fn get_buckets(state: Data<AppState>, path: Path<i32>) -> impl Responder {
    //format!("Hello")
    let user_id: i32 = path.into_inner();

    match sqlx::query_as::<_, Bucket>(
        "SELECT id, user_id, bucket_name, access_key_id, secret_key
        FROM bucket WHERE user_id = $1"
        )
        .bind(user_id)
        .fetch_all(&state.db)
        .await
        {
            Ok(bucket) => HttpResponse::Ok().json(bucket),
            Err(_) => HttpResponse::NotFound().json("No buckets found"),
        }
}

// TODO: test
pub async fn signout(state: Data<AppState>, body: Json<Profile>) -> impl Responder {
    //format!("hello")
    let profile: Profile = body.into_inner();

    match sqlx::query_as::<_, SingleUser>(
        "SELECT id, username, email, session_id
        FROM users
        WHERE id = $1
        AND username = $2
        AND email = $3"
        )
        .bind(profile.user_id)
        .bind(profile.username)
        .bind(profile.email)
        .fetch_one(&state.db)
        .await
        {
            Ok(user) => {
                match sqlx::query_as::<_, SingleUser>(
                    "UPDATE users
                    SET session_id = ''
                    WHERE id = $1
                    RETURNING id, username, email, session_id"
                    )
                    .bind(user.id)
                    .fetch_one(&state.db)
                    .await
                    {
                        Ok(_) => HttpResponse::Ok().json("Successfully Signing Out"),
                        Err(err) => HttpResponse::InternalServerError().json(format!("{:?}", err)),
                    }
            },
            Err(error) => HttpResponse::InternalServerError().json(format!("{:?}", error)),
        }
}

pub async fn auth(state: Data<AppState>, body: Json<AuthInfo>) -> impl Responder {
    let auth_info: AuthInfo = body.into_inner();
    
    match sqlx::query_as::<_, SingleUser>(
        "SELECT id, username, email, session_id
        FROM users
        WHERE id = $1
        AND session_id = $2"
        )
        .bind(auth_info.user_id)
        .bind(auth_info.session_id)
        .fetch_one(&state.db)
        .await
        {
            Ok(_) => HttpResponse::Ok().json("Authorized"),
            Err(_) => HttpResponse::NotFound().json("Not authorized"),
        }
}

pub async fn login(state: Data<AppState>, body: Json<Login>) -> impl Responder {
    let login_info: Login = body.into_inner();

    let email: String = login_info.email;
    let password: Option<String> = login_info.password;

    match password {
        None => HttpResponse::Unauthorized().json("Must provide username and password"),
        Some(pass) => {
            match sqlx::query_as::<_, User>(
                "SELECT id, username, password, email
                FROM users
                WHERE email = $1"
                )
                .bind(email)
                .fetch_one(&state.db)
                .await
                {
                    Ok(user) => {
                        let hash_secret = std::env::var("HASH_SECRET").expect("HASH_SECRET must be set!");
                        let mut verifier = Verifier::default();
                        let is_valid = verifier
                            .with_hash(&user.password)
                            .with_password(pass)
                            .with_secret_key(hash_secret)
                            .verify()
                            .unwrap();

                        if is_valid {
                            let session_id = generate_random_string(12);
                            match sqlx::query_as::<_, SingleUser>(
                                "UPDATE users 
                                SET session_id = $1 
                                WHERE username = $2 
                                RETURNING id, username, email, session_id"
                                )
                                .bind(&session_id)
                                .bind(&user.username)
                                .fetch_one(&state.db)
                                .await
                            {
                                Ok(u) => {
                                    let c = Cookie::build("RSESSION", session_id)
                                        .http_only(true)
                                        .domain("127.0.0.1")
                                        .path("/")
                                        .same_site(SameSite::None)
                                        .finish();

                                    //HttpResponse::Ok().cookie(c).finish()
                                    HttpResponse::Ok()
                                        .append_header(("Access-Control-Expose-Headers", "Set-Cookie"))
                                        .append_header(("Access-Control-Allow-Credentials", "true"))
                                        .append_header(("Access-Control-Allow-Headers", "Content-Type"))
                                        .append_header(("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE"))
                                        .append_header(("Access-Control-Allow-Origin", "*")) // or http://127.0.0.1:3000
                                        .cookie(c).json(u)
                                },
                                Err(err) => HttpResponse::InternalServerError().json(format!("{:?}", err)),
                            }
                        } else {
                            HttpResponse::Unauthorized().json("Must provide username and password")
                        }

                    },
                    Err(error) => {
                        HttpResponse::InternalServerError().json(format!("{:?}", error))
                    },
                }
        }
    }
}
