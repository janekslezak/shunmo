import type { ReactElement, SVGProps } from "react";

/**
 * Flat sumi-e mini icons for dialogue topics — consistent 1.9px stroke,
 * round caps/joins, drawn on a 24 viewBox, colored via currentColor.
 */

type P = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/** waving hand — greetings */
function WaveHand(props: P) {
  return (
    <Base {...props}>
      <path d="M8 12.5V6.8a1.3 1.3 0 0 1 2.6 0v4.4" />
      <path d="M10.6 11V5.3a1.3 1.3 0 0 1 2.6 0V11" />
      <path d="M13.2 11.2V6.4a1.3 1.3 0 0 1 2.6 0v5.6" />
      <path d="M15.8 12.6V9.6a1.3 1.3 0 0 1 2.6 0v4.6c0 3.6-2.5 5.8-5.7 5.8-2.5 0-3.9-.9-5.3-2.9l-2.1-3.2c-.5-.8-.3-1.7.5-2.1.7-.4 1.5-.1 2 .6l1 1.6" />
      <path d="M4.5 6.5c.6-1 1.6-1.7 2.7-1.9" />
      <path d="M18.9 5.2c.5.5.9 1.2 1.1 1.9" />
    </Base>
  );
}

/** two chat bubbles — introductions */
function ChatBubbles(props: P) {
  return (
    <Base {...props}>
      <path d="M9.5 11.5H5.8c-1.2 0-2.2-1-2.2-2.2V6c0-1.2 1-2.2 2.2-2.2h6.4c1.2 0 2.2 1 2.2 2.2v1" />
      <path d="M6.4 11.5v2l2.2-2" />
      <path d="M18.2 8h-5.4c-1.2 0-2.2 1-2.2 2.2v2.6c0 1.2 1 2.2 2.2 2.2h4.2l2.4 2v-2.4c.7-.3 1.2-1 1.2-1.8v-2.6c0-1.2-1-2.2-2.2-2.2Z" />
    </Base>
  );
}

/** noodle bowl with chopsticks — restaurant / food */
function NoodleBowl(props: P) {
  return (
    <Base {...props}>
      <path d="M4 12.5h16" />
      <path d="M5.5 12.5c0 4 2.9 6.5 6.5 6.5s6.5-2.5 6.5-6.5" />
      <path d="M9 19v1.5M15 19v1.5" />
      <path d="M9.5 9.5c0-1.2 1-1.4 1-2.6M12.5 9.5c0-1.2 1-1.4 1-2.6" />
      <path d="M15.5 4.5 20 9.8M18 3.5l3 4.6" />
    </Base>
  );
}

/** price tag — shopping */
function PriceTag(props: P) {
  return (
    <Base {...props}>
      <path d="M4 10.5V5.2C4 4.5 4.5 4 5.2 4h5.3c.5 0 .9.2 1.2.5l8 8c.6.6.6 1.6 0 2.2l-5 5c-.6.6-1.6.6-2.2 0l-8-8c-.3-.3-.5-.7-.5-1.2Z" />
      <circle cx="8.4" cy="8.4" r="1.4" />
      <path d="M10.5 14.5h4M12.5 12.5v4" />
    </Base>
  );
}

/** alarm clock — time & date */
function AlarmClock(props: P) {
  return (
    <Base {...props}>
      <circle cx="12" cy="13.5" r="6.5" />
      <path d="M12 10.5v3l2.2 1.6" />
      <path d="M5 4.5 3.2 6.3M19 4.5l1.8 1.8" />
      <path d="M9.5 19.5 8.5 21M14.5 19.5l1 1.5" />
    </Base>
  );
}

/** signpost — directions / travel */
function Signpost(props: P) {
  return (
    <Base {...props}>
      <path d="M12 3v18" />
      <path d="M12 6h6l2 2-2 2h-6" />
      <path d="M12 12H6l-2 2 2 2h6" />
      <path d="M9 21h6" />
    </Base>
  );
}

/** house with heart — family */
function FamilyHome(props: P) {
  return (
    <Base {...props}>
      <path d="M4.5 10.5 12 4l7.5 6.5" />
      <path d="M6 9.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" />
      <path d="M12 16.8s-2.3-1.5-2.3-3a1.3 1.3 0 0 1 2.3-.9 1.3 1.3 0 0 1 2.3.9c0 1.5-2.3 3-2.3 3Z" />
    </Base>
  );
}

/** kite — hobbies / leisure */
function Kite(props: P) {
  return (
    <Base {...props}>
      <path d="M12 3.5 17.5 9 12 20 6.5 9 12 3.5Z" />
      <path d="M6.5 9h11M12 3.5V20" />
      <path d="M12 20c0 1.2-1 1.5-1.5 2.5" />
      <path d="M9.8 21.3 9 22.5M11.6 21.9l-.5 1.3" />
    </Base>
  );
}

const ICONS: Record<string, (p: P) => ReactElement> = {
  greetings: WaveHand,
  introductions: ChatBubbles,
  restaurant: NoodleBowl,
  shopping: PriceTag,
  "time-date": AlarmClock,
  directions: Signpost,
  family: FamilyHome,
  hobbies: Kite,
};

interface TopicIconProps extends P {
  dialogueId: string;
}

/** Per-dialogue topic illustration (falls back to chat bubbles). */
export default function TopicIcon({ dialogueId, ...props }: TopicIconProps) {
  const Icon = ICONS[dialogueId] ?? ChatBubbles;
  return <Icon {...props} />;
}
