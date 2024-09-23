
import BucketPage from "@/app/components/BucketPage";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";


const Page = ({
    params,
} : { 
    params: {user: string, bucketname: string}; 
}) => {

    const cookieStore = cookies();
    const cookie = cookieStore.get('RSESSION')?.value;

    if (cookie === undefined || cookie === null || cookie === "") {
        redirect("/");
    }
    return (
        <BucketPage user={params.user} bucketname={params.bucketname}/>
    );
}

export default Page;
