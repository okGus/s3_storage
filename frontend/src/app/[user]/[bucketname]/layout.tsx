export default function BlobLayout({
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
