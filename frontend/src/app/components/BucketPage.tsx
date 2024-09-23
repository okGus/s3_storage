'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";


const BucketPage = ({user, bucketname}: {user: string, bucketname: string}) => {

    const router = useRouter();
    const [visibility, setVisibility] = useState("visible");
    const [opVis, setOpVis] = useState("hidden");

    return (
        // TODO: Get bucket name given bucket id 
        <div className="flex flex-col h-full">
            <div className="p-2 m-2">
                <div className="flex justify-end">
                    <button className="w-56 border-2 rounded text-black bg-transparent text-xl font-semibold cursor-pointer" onClick={() => router.push(`/${user}/${bucketname}/CreateBlob`)}>Upload File</button>
                </div>
                <div className="p-2">
                    {bucketname}
                </div>
                <div className="flex justify-between p-2 outline outline-1">
                    <div>Name</div>
                    <div>Type</div>
                    <div>Size</div>
                </div>

                {/*<div className="flex flex-col p-2 m-2 place-content-center items-center">*/}
                <div className="flex flex-col">
                    <div className={`p-2 m-2` + ` ${visibility}`}>
                        <div className="flex flex-col opacity-50 items-center">
                            <p className="font-bold">No Objects</p>
                            <p>You don&#39;t have any objects in this bucket.</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className={`p-2 m-2` + ` ${opVis}`}>
            </div>
        </div>
    );
}

export default BucketPage;
