import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { IoSearch } from "react-icons/io5";
import { MdAdd } from "react-icons/md";
import { TiMinus } from "react-icons/ti";
import { IconContext } from "react-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import AddUser from "../AddUser";
import { useUserStore } from "@/store/userStore";
import { db } from "@/lib/firebase";

import { onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";
import { set } from "react-hook-form";
import { useChatStore } from "@/store/chatStore";

function Chatlist() {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();
  const ForwardedMdAdd = React.forwardRef((props, ref) => (
    <MdAdd ref={ref} {...props} />
  ));
  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });
    const chatIndex = userChats.findIndex(
      (item) => item.chatId === chat.chatId
    );
    userChats[chatIndex].isSeen = true;

    const userChatsRef = doc(db, "userchats", currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
    } catch (error) {
      console.log(error);
    }
    changeChat(chat.chatId, chat.user);
  };

  useEffect(() => {
    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        const items = res.data().chats;

        const promises = items.map(async (item) => {
          const userDocRef = doc(db, "users", item.receiverId);
          const userDocSnap = await getDoc(userDocRef);

          const user = userDocSnap.data();
          return { ...item, user };
        });

        const chatData = await Promise.all(promises);

        setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
      }
    );

    return () => unSub();
  }, [currentUser.id]);

  return (
    <div className="flex-1 overflow-y-scroll scrollbar-custom">
      <Dialog>
        <div className="search flex  items-center px-2">
          <div className="searchbar flex-1 flex  bg-gray-400 items-center rounded-lg p-1">
            <IoSearch className="h-6 w-6" />
            <input
              placeholder="Search"
              className="pl-2 bg-transparent border-none focus:border-none active:border-none focus:outline-none w-full"
            />
          </div>
          <IconContext.Provider
            value={{ color: "white", className: "h-6 w-6 cursor-pointer" }}
          >
            <div onClick={() => setAddMode((prev) => !prev)}>
              <DialogTrigger asChild>
                {addMode ? <TiMinus /> : "+"}
              </DialogTrigger>
            </div>
          </IconContext.Provider>
          <AddUser />
        </div>
      </Dialog>
      <div className="chatlist ">
        {chats.map((chat) => (
          <div
            key={chat.chatId}
            onClick={() => handleSelect(chat)}
            className="chat p-3 flex items-center gap-3 border-b-gray-300 border-b-[1px] cursor-pointer"
            style={
              chat?.isSeen
                ? { backgroundColor: "transparent" }
                : { backgroundColor: "blue" }
            }
          >
            <Avatar>
              <AvatarImage
                src={chat.user.avatar || "https://github.com/shadcn.png"}
                className="object-cover"
              />
              <AvatarFallback>{chat.user.username}</AvatarFallback>
            </Avatar>
            <div className="texts">
              <span className="font-semibold text-md">
                {chat.user.username}
              </span>
              <p>{chat.lastMessage}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Chatlist;
