/** A small, calm collection of daily quotes. Deterministic by date so the
 * quote is stable through the day and changes each morning. */

export interface Quote {
  text: string;
  author: string;
}

export const QUOTES: Quote[] = [
  { text: "How we spend our days is, of course, how we spend our lives.", author: "Annie Dillard" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "Well begun is half done.", author: "Aristotle" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Do the hard jobs first. The easy jobs will take care of themselves.", author: "Dale Carnegie" },
  { text: "Small deeds done are better than great deeds planned.", author: "Peter Marshall" },
  { text: "What you do every day matters more than what you do once in a while.", author: "Gretchen Rubin" },
  { text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack" },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
  { text: "Motivation gets you going, but discipline keeps you growing.", author: "John C. Maxwell" },
  { text: "Little by little, one travels far.", author: "J.R.R. Tolkien" },
];

/** Days since the Unix epoch for a given date (local). */
function dayIndex(date: Date): number {
  return Math.floor(
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() /
      86_400_000,
  );
}

/** The quote of the day — stable per calendar day. */
export function quoteForDate(date: Date): Quote {
  return QUOTES[Math.abs(dayIndex(date)) % QUOTES.length];
}
