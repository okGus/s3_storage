'use client';

import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function Home() {
    const router = useRouter();
    
    const { mutate: login, data: loginRes } = useMutation({
        mutationFn: async (loginInfo: { email: string, password: string}) => {
            return await axios.post("http://127.0.0.1:8080/login", loginInfo, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin' : 'http://127.0.0.1:3000',// or '*'
                    //'Access-Control-Expose-Headers' : 'Set-Cookie',
                    //'Access-Control-Allow-Credentials' : 'true',
                    //'Access-Control-Allow-Headers': 'access-control-allow-origin, content-type', // or '*'
                    //'Access-Control-Allow-Methods': 'POST', // or '*'
                },
            });
        },
    });

    const handleSubmit = async (formData: FormData) => {
        //e.preventDefault();
        //'use server';
        //const formData = new FormData(e.target);
        //console.log(formData);
        const log = formData.get("btnLogIn");
        const reg = formData.get("btnRegister");
        
        if (log !== null) {
            const email: string = formData.get("email")?.toString()!;
            const password: string = formData.get("password")?.toString()!;
            
            login({ email: email, password: password });
        }
        if (reg !== null) {
            console.log("redirecting to /Register");
            //redirect("/Register");
            router.push('/Register');
        }
    };

    useEffect(() => {
        if (loginRes) {
            //console.log(loginRes);
            const usersData: {id: number, username: string | "", email: string} = {id: loginRes.data.id, username: loginRes.data.username, email: loginRes.data.email };
            //const s: {session_id: string} = {session_id: loginRes.data.session_id};
            localStorage.setItem('userData', JSON.stringify(usersData));
            //localStorage.setItem('sess', JSON.stringify(s))
            router.push(`/${loginRes.data.username}`)
        }
    }, [loginRes, router]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
                <div className="form-container">
                    <h1 className="form-header">Object-Like Storage</h1>
                    {/*<form id="loginForm" onSubmit={handleSubmit} method="POST">*/}
                    <form id="loginForm" action={handleSubmit}>
                        <div className="input-field">
                            <label htmlFor="email">Email</label>
                            <input type="text" name="email" id="email" placeholder="Email" />
                        </div>
                        <div className="input-field">
                            <label htmlFor="password">Password</label>
                            <input type="password" name="password" id="password" placeholder="Password" />
                        </div>
                        {/* <input type="submit" onFocus={() => handleFocus("btnLogIn")} value="Log In" /> */}
                        {/*<input type="submit" onFocus={() => handleFocus("btnRegister")} value="Register" /> */}
                        <input type="submit" name="btnLogIn" value="Log In" />
                        <input type="submit" name="btnRegister" value="Register" />
                    </form>
                </div>
            </div>
        </main>
    );
};
