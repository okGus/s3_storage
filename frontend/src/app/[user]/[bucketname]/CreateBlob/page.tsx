import CreateBlob from "@/app/components/CreateBlob";

//export default function Page() {
//  return <CreateBlob />;
//}

export default function Page({
    params,
} : {
    params : {user: string, bucketname: string}
}) {
    return (
            <CreateBlob bucketname={params.bucketname} />
    )
}
