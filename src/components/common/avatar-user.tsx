import React from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { TUser } from "@/types";

const AvatarUser = ({
    user,
    avatarOnly,
}: {
    user: TUser | null;
    avatarOnly?: boolean;
}) => {
    return (
        <div className="flex items-center gap-2 p-1 text-left text-sm">
            <Avatar className="h-9 w-9 rounded-full">
                <AvatarFallback className="rounded-full bg-primary/10 dark:bg-primary text-primary dark:text-white">
                    {user?.name?.charAt(0)}
                </AvatarFallback>
            </Avatar>
            {!avatarOnly && <div className="hidden flex-1 gap-1 text-left text-sm leading-tight sm:grid">
                <span className="truncate font-medium">{user?.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                    {user?.email}
                </span>
            </div>}
        </div>
    );
};

export default AvatarUser;
