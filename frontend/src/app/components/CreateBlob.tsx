'use client';

import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const CreateBlob = ({bucketname} : {bucketname: string}) => {
    //TODO: Create usemutation to submit image
    const userData: {id: number, username: string, email: string} = JSON.parse(localStorage.getItem('userData')!);
    const router = useRouter();

    const uploadImage = useMutation({
        mutationFn: async (imageInfo: {image: File, path: string, type_: string, size: number, bucket_id: number, created_on: number, updated_on: number}) => {
            return axios.post('http://127.0.0.1:8080/api/upload_image', imageInfo);
        },
    });

    const upload = useMutation({
        mutationFn: async (img: FormData) => {
            return axios.post('http://127.0.0.1:8080/api/upload_image', img, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },
    });

    const getBucketID = useQuery({
        queryKey: ["get-bucketid"],
        queryFn: async () => {
            const url = `http://127.0.0.1:8080/get_bucketid/${userData.id}/${bucketname}`;
            
            const response = await axios.get(url);

            return response.data;
        },
        staleTime: Infinity,
        //enabled: false
    });

    const submitFiles = (formData: FormData) => {
        const inpFile = formData.get("inpFile") as File;
        //const path = bucketname + "/" + inpFile.name;
        //const type = inpFile.type;
        //const size = inpFile.size;
        //const bucketID = getBucketID.data.id;
        //const created_on = Date.now();
        //const updated_on = Date.now();
        const data = new FormData();
        
        data.append("username", userData.username);
        data.append("bucketname", bucketname);
        data.append("inpFile", inpFile);
        
        upload.mutate(data);
        //uploadImage.mutate({image: inpFile, 
        //                    path: path, 
        //                    type_: type, 
        //                    size: size, 
        //                    bucket_id: bucketID, 
        //                    created_on: created_on, 
        //                    updated_on: updated_on});
    };

    useEffect(() => {
        if (uploadImage.isSuccess) {
            uploadImage.data;
        }
        if (upload.isSuccess) {
            upload.data;
        }
        if (upload.data) {
            router.back();
        }
    });
    
    return (
        <>
            <div className="bucket-container w-3/4 h-3/4 bg-gray-50 fixed top-24 left-36 p-12 shadow-2xl overflow-hidden">
                <div>
                    <h1 className="text-2xl">Upload</h1>
                    <br/>
                    <form action={submitFiles} id="fileForm">
                        <input type="file" name="inpFile" id="inpFile"/>
                        <br/>
                        <button type="submit" className="w-56 border-2 rounded text-black bg-transparent text-xl font-semibold cursor-pointer"> 
                            Add Files
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

export default CreateBlob;
