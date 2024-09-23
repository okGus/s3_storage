"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const Register = () => {
    const [user_name, setUsername] = useState("");
    const [err, setErr] = useState("");
    const router = useRouter();

    const { data: queryData } = useQuery({
        queryKey: ["user_info", user_name],
        queryFn: async () => {
            const url = `http://127.0.0.1:8080/user/${user_name}`;
            //console.log(url);
            const response = await axios.get(url);

            //console.log(response.data);
            
            return response.data;
        },
       //refetchOnWindowFocus: false,
       //enabled: false,
    });

    const handleSubmit = (formData: FormData) => {
        const username = formData.get("username")?.toString()!;
        const email = formData.get("email")?.toString()!;
        const password = formData.get("password")?.toString()!;
        
        newUser({ username: username, password: password, email: email });
    };

    const { mutate: newUser, data: newUserData } = useMutation({
        mutationFn: async (user: { username: string, password: string, email: string }) => {
            return await axios.post("http://127.0.0.1:8080/users", user);
        },
    });

    useEffect(() => {
        if (queryData) {
            setErr("Username already exists!");
        } else {
            setErr("");
        }

        if (newUserData) {
            //console.log(newUserData);
            router.push("/");
        }

    }, [user_name, queryData, newUserData, router]);

    return (
        <div className="form-container">
            <h1 className="form-header">Register</h1>
            <form action={handleSubmit}>
                <div className="input-field">
                    <label htmlFor="username">Username</label>
                    <input type="text" name="username" id="username" placeholder="Username" onChange={(e) => setUsername(e.target.value)}/>
                </div>
                <div className="input-field">
                    <label htmlFor="email">Email</label>
                    <input type="text" name="email" id="email" placeholder="Email" required />
                </div>
                <div className="input-field">
                    <label htmlFor="password">Password</label>
                    <input type="password" name="password" id="password" placeholder="Password" required />
                </div>
                <input type="submit" value="Create Account" />
                <p id="error">{err}</p>
            </form>
        </div>
    );
};

export default Register;
