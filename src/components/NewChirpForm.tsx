import { useSession } from "next-auth/react"
import { Button } from "./Button"
import { ProfileImage } from "./ProfileImage"
import { type FormEvent, useCallback, useLayoutEffect, useRef, useState } from "react";
import { api } from "~/utils/api";

function updateTextAreaSize(textArea?: HTMLAreaElement) {
    if (textArea == null) return
    textArea.style.height = "0"
    textArea.style.height = `${textArea.scrollHeight}px`
}

export function NewChirpForm() {
    const session = useSession();
    if (session.status !== "authenticated") return;

    return <Form/>
}

function Form() {
    const session = useSession();
    const [inputValue, setInputValue] = useState("");
    const textAreaRef = useRef<HTMLTextAreaElement>();
    const inputRef = useCallback((textArea: HTMLTextAreaElement) => {
        updateTextAreaSize(textArea);
        textAreaRef.current = textArea;
    }, []);
    const trpcUtils = api.useContext();

    useLayoutEffect(() => {
        updateTextAreaSize(textAreaRef.current);
    }, [inputValue]);

    const createChirp = api.chirp.create.useMutation({
        onSuccess: (newChirp) => {
            setInputValue("");

            if ( session.status !== "authenticated") return

            trpcUtils.chirp.infiniteFeed.setInfiniteData({}, (oldData) => {
                if (oldData == null || oldData.pages[0] == null) return

                const newCacheChirp = {
                    ...newChirp,
                    likeCount: 0,
                    likedByMe: false,
                    user: {
                        id: session.data.user.id,
                        name: session.data.user.name || null,
                        image: session.data.user.image || null,
                    }
                }
                return {
                    ...oldData,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    pages: [
                        {
                        ...oldData.pages[0],
                        chirps: [newCacheChirp, ...oldData.pages[0].chirps],
                        },
                        ...oldData.pages.slice(1),
                    ]
                }
            })
        },
    });

    if (session.status !== "authenticated") return null;

    function handleSubmit(e: FormEvent) {
        e.preventDefault()

        createChirp.mutate({ content: inputValue })
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-b px-4 py-2">
                <div className="flex gap-4">
                    <ProfileImage src={session.data.user.image}/>
                    <textarea 
                        ref={inputRef}
                        style={{ height: 0 }}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="flex-grow resize-none 
                        overflow-hidden p-4 text-lg outline-none" 
                        placeholder="What's Happenning?"
                    />
                </div>
                <Button className="self-end">Chirp</Button>
            </form>
        </>
    )    
}

