import Image from "next/image"
import { VscAccount } from "react-icons/vsc"

type ProfileImageProps = {
    src?: string | null
    className?: string
}


export function ProfileImage({src, className = ""} : ProfileImageProps) {
    return(
        <>
            <div 
            className={`relative h-i2 w-12 overflow-hidden 
            rounded-full ${className}`}>
                {src == null ? ( <VscAccount className="h-full w-full"/> ) : (
                <Image src={src} alt="Profle Image" quality={100} fill />)}
            </div>
        </>
    )
}