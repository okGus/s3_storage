export default function S3Layout({
    modal,
    children,
}: {
    modal: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <>
            {modal}
            {children}
        </>   
    )
}
