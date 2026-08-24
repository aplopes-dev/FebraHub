"use client";

import { useState, useCallback } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@citybox/ui/atoms";
import { Button } from "@citybox/ui/atoms";
import { Label, Textarea } from "@citybox/ui/atoms";

import type { OpportunityUser } from "../../types";

interface CommentInputProps {
  currentUser: OpportunityUser;
  onSubmit: (content: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function CommentInput({ currentUser, onSubmit }: CommentInputProps) {
  const [comment, setComment] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = useCallback(() => {
    if (!comment.trim()) return;
    onSubmit(comment.trim());
    setComment("");
    setIsFocused(false);
  }, [comment, onSubmit]);

  return (
    <div className="flex min-w-0 gap-3">
      <Avatar className="size-8 shrink-0">
        <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
        <AvatarFallback className="text-xs">
          {getInitials(currentUser.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-col gap-1.5">
          <Label>Adicionar comentário</Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="min-h-24"
          />
        </div>

        {isFocused && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSubmit}
              disabled={!comment.trim()}
            >
              Comentar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
