'use client';

import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CreateBucket = () => {
    const [user_id, setID] = useState(0);
    const [username, setUsername] = useState("");
    const router = useRouter();

    const handleSubmit = (formData: FormData) => {
        const bucket_name = formData.get('bucketname')?.toString()!;
        createbucket({ user_id: user_id, bucket_name: bucket_name, username: username });
    };

    const { mutate: createbucket, data: bucketdata } = useMutation({
        mutationFn: async (bucket: { user_id: number, bucket_name: string, username: string }) => {
            return await axios.post("http://127.0.0.1:8080/create_bucket", bucket);
        },
    });

    useEffect(() => {
        const initialState: {id: number, username: string, email: string} = JSON.parse(localStorage.getItem('userData')!);
        setID(initialState.id);
        setUsername(initialState.username);

        if (bucketdata) {
            router.back();
        }

        
    }, [bucketdata, router]);

    return (
        <>
            <div className="bucket-container w-3/4 h-3/4 bg-gray-50 fixed top-24 left-36 p-12 shadow-2xl overflow-hidden">
                <div>
                    <h1 className="text-2xl">Create bucket</h1>
                    <br/>
                    <form action={handleSubmit}>
                        <div className="input-field">
                            <label htmlFor="bucketname">Bucket Name</label>
                            <input type="text" name="bucketname" id="bucketname" placeholder="mybucket" required/>
                        </div>
                        <div>
                            <input type="submit" value="Create"/>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default CreateBucket;
