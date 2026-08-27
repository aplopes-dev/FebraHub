"use client";

import { useMemo } from "react";
import { Box, ButtonBase, Tooltip } from "@mui/material";
import type { ChatMessageReaction } from "@/types/api/conversation";

type MessageReactionsProps = {
  reactions: ChatMessageReaction[];
  currentMembershipId: string | null;
  /** Clique numa pílula = toggle da minha reação naquele emoji. */
  onToggle?: (emoji: string) => void;
};

type ReactionGroup = {
  emoji: string;
  count: number;
  mine: boolean;
  actorNames: string[];
};

function groupReactions(
  reactions: ChatMessageReaction[],
  currentMembershipId: string | null,
): ReactionGroup[] {
  const map = new Map<string, ReactionGroup>();
  for (const reaction of reactions) {
    const mine =
      currentMembershipId != null &&
      reaction.actorMembershipId === currentMembershipId;
    const existing = map.get(reaction.emoji);
    if (existing) {
      existing.count += 1;
      existing.mine = existing.mine || mine;
      if (reaction.actorName) existing.actorNames.push(reaction.actorName);
    } else {
      map.set(reaction.emoji, {
        emoji: reaction.emoji,
        count: 1,
        mine,
        actorNames: reaction.actorName ? [reaction.actorName] : [],
      });
    }
  }
  return [...map.values()];
}

export default function MessageReactions({
  reactions,
  currentMembershipId,
  onToggle,
}: MessageReactionsProps) {
  const groups = useMemo(
    () => groupReactions(reactions, currentMembershipId),
    [reactions, currentMembershipId],
  );

  if (groups.length === 0) return null;

  return (
    <Box sx={{ mt: 0.5, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {groups.map((group) => (
        <Tooltip
          key={group.emoji}
          title={group.actorNames.join(", ")}
          disableHoverListener={group.actorNames.length === 0}
        >
          <ButtonBase
            onClick={onToggle ? () => onToggle(group.emoji) : undefined}
            aria-pressed={group.mine}
            aria-label={`Reação ${group.emoji}`}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              px: 0.9,
              py: 0.25,
              borderRadius: 999,
              border: "1px solid",
              fontSize: 13,
              lineHeight: 1,
              bgcolor: group.mine
                ? "color-mix(in srgb, var(--mui-palette-primary-main) 14%, var(--mui-palette-background-paper))"
                : "background.paper",
              borderColor: group.mine
                ? "color-mix(in srgb, var(--mui-palette-primary-main) 55%, transparent)"
                : "divider",
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            <span>{group.emoji}</span>
            {group.count > 1 ? (
              <Box
                component="span"
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: group.mine ? "primary.main" : "text.secondary",
                }}
              >
                {group.count}
              </Box>
            ) : null}
          </ButtonBase>
        </Tooltip>
      ))}
    </Box>
  );
}
