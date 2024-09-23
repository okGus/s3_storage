'use server';

import { cookies } from "next/headers";

export const changeCookie = async () => {

    cookies().set("RSESSION", "");

}
