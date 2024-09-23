import { redirect } from "next/navigation";
import UserDetails from "../components/UserDetails";
import { cookies } from "next/headers";

//export default UserDetails;
const Page = ({
    params,
}: {
    params: {user: string},
}) => {
    const cookieStore = cookies();
    const cookie = cookieStore.get('RSESSION')?.value;

    if (cookie === undefined || cookie === null || cookie === "") {
        redirect("/");
    } 

    const name = params.user;

    return (
        <UserDetails cookie={cookie!} name={name}/>
    );
};
export default Page;
