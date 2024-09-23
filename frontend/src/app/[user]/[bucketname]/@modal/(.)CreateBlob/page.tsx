import CreateBlob from "@/app/components/CreateBlob";
import { Modal } from "@/app/components/Modal";

export default function Page({
    params,
} : {
    params : {user: string, bucketname: string}
}) {
    return (
        <Modal>
            <CreateBlob bucketname={params.bucketname} />
        </Modal>
    )
}
