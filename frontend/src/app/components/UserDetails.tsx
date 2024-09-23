"use client";

import { faTrash } from "@fortawesome/free-solid-svg-icons/faTrash";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { redirect, usePathname, useRouter } from "next/navigation";
//import { useParams } from "next/navigation";
import { Key, useEffect, useState } from "react";
import Signout from "./Signout";

const UserDetails = ({cookie, name}: {cookie: string, name: string}) => {
    // /auth user_id with sess_id, if sess_id is empty, redirect to homepage
    // if user_id's DBsession_id != sess_id, redirect to homepage
    // POST useMutation
    //const [sess_id, setSessID] = useState("");
    
    const [storedUserData, setStoredUserData] = useState<{id: number, username: string, email: string}>({id: -1, username: "", email: ""});
    const router = useRouter();
    const pathname = usePathname();

    //useEffect(() => {
    //    if (localStorage.getItem('userData') === null || cookie === null) {
    //        redirect("/");
    //    }
    //});
    
    const { mutate: authUser, data: authData } = useMutation({
        mutationFn: async (authInfo: {user_id: number,  session_id: string }) => {
            return await axios.post("http://127.0.0.1:8080/auth", authInfo, {
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

    useEffect(() => {
        const initialState: {id: number, username: string, email: string} = JSON.parse(localStorage.getItem('userData')!);
        //const sess: {session_id: string} = JSON.parse(localStorage.getItem('sess')!);

        if (name !== initialState.username) {
            router.push(`/${initialState.username}`);
        }

        authUser({ user_id: initialState.id, session_id: cookie});

        setStoredUserData({...initialState});
    }, [authUser, router, cookie, name]);

    const [visibility, setVisibility] = useState("visible");
    const [opVis, setOpVis] = useState("hidden");
    
    const { data: bucketData } = useQuery({
        queryKey: ["bucket_info", storedUserData.id],
        queryFn: async () => {
            const url = `http://127.0.0.1:8080/get_buckets/${storedUserData.id}`;
            //console.log(url);
            const response = await axios.get(url);

            //console.log(response.data);
            return response.data;
        },
        refetchInterval: 30000, // 30 seconds in milliseconds
       //refetchOnWindowFocus: true,
       //enabled: false,
    });

    useEffect(() => {
        if (authData) {
            if (authData.data == "Not Authorized") {
                router.push('/');
            }
        }
        if (bucketData && bucketData.length > 0) {
            //console.log(bucketData)
            setVisibility("hidden");
            setOpVis("visible");
            //router.refresh();
            //router.replace(pathname);
        }

    }, [bucketData, authData, router, pathname]);

    const { mutate: DeleteBucket, data: DeletedBucketData } = useMutation({
        mutationFn: async (bucketInfo: {user_id: number,  bucket_name: string }) => {
            return await axios.delete("http://127.0.0.1:8080/delete_bucket", {
                data: bucketInfo
            });
        },
    });
                                                                                                                                                                                                                                
    const deleteBucket = (bucketname: string) => {
        const user_id = storedUserData.id;
        const bucket_name = bucketname;

        DeleteBucket({user_id: user_id, bucket_name: bucket_name});
    };

    useEffect(() => {
        if (DeletedBucketData) {
            console.log(DeletedBucketData);
        }
    });

    return (
        <div className="flex flex-col bucket-container h-full">
            <div className="p-2 m-2">
                <div className="flex justify-between pt-3 pb-3 mt-3 mb-3">
                    <div>
                        <h1>Object Like Storage</h1>
                    </div>
                    <div>
                        <Signout id={storedUserData.id} username={storedUserData.username} email={storedUserData.email} >
                        </Signout>
                    </div>
                </div>

                <div className="flex flex-row justify-between">
                    <div>
                        <p className="p-1 m-1">{storedUserData.username}</p>
                    </div>
                    <div id={storedUserData.id.toString()} className="flex flex-row items-center bg-orange-400">
                        <button className="p-1 m-1" onClick={() => router.push(`/${storedUserData.username}/CreateBucket`)}>Create bucket</button>
                        <div className="h-6 w-px bg-black"></div>
                    </div>
                </div>
                <div className="outline outline-1 w-full relative top-1"></div>
                
            </div>
            <div className="p-2 m-2">
                Name
            </div>
            <div className={`p-2 m-2` + ` ${visibility}`}>
                <div id="no-buckets" className="flex place-content-center">
                    <div className="flex flex-col opacity-50 items-center">
                        <p>You currently do not have buckets</p>
                        <p>Click <q>Create Bucket</q> to start</p>
                    </div>
                </div>
            </div>
            <div className={`p-2 m-2` + ` ${opVis}`}>
                {bucketData && bucketData.map((bucketinfo: { id: number, user_id: number, bucket_name: string, access_key_id: string, secret_key: string }, i: Key) => 
                    <div key={i} className="flex flex-row justify-between">
                        <Link href={`/${storedUserData.username}/${bucketinfo.bucket_name}`}>
                            {bucketinfo.bucket_name}
                        </Link>
                        <div>
                            <FontAwesomeIcon icon={faTrash} role="button" onClick={() => deleteBucket(bucketinfo.bucket_name)}/>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDetails;
