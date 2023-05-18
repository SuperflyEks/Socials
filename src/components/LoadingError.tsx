import { VscError } from "react-icons/vsc"

type LoadingErrorProps = {
    big?: boolean
}

export function LoadingError({ big = false } : LoadingErrorProps ) {
    const sizeClasses = big ? "w-16 h-16" : "w-10 h-10"
    
    return (
        <>
            <div className="flex justify-center p-2">
                <VscError className={`animate-pulse ${sizeClasses}`}/>
            </div>
        </>
    )
}