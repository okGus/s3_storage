'use client';
 
import { useRouter } from 'next/navigation'
 
export function Modal({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    return (
        <>
            <div className='modal w-full h-screen fixed top-0 left-0'>
                <button className='fixed top-12 left-36 bg-white' onClick={() => {router.back()}}>
                Back
                </button>
                <div>{children}</div>
            </div>
        </>
    )
}
