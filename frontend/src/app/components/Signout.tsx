'use client';

import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { changeCookie } from "./changeCookie";

const Signout = ({id, username, email} : {id: number, username: string, email: string }) => {
   
    const handler = async () => {
        console.log("signing out!");
        console.log(id);
        console.log(username);
        console.log(email);

        signout({user_id: id, username: username, email: email});
        await changeCookie();  
    };

    const { mutate: signout, data: data } = useMutation({
        mutationFn: async (profile: {user_id: number, username: string, email: string}) => {
            return await axios.post("http://127.0.0.1:8080/signout", profile, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin' : 'http://127.0.0.1:3000',// or '*'
                },
            });
        },
    });

    return (
        <button onClick={handler} type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Signout</button>
    );
}

export default Signout;
