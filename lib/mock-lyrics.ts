/**
 * Original lyrics written for the fictional demo catalogue (the SoundHelix audio is instrumental).
 * Empty strings are instrumental gaps and render as a "• • •" breather.
 * Timings are generated from line length so the karaoke effect feels natural.
 */
import type { LyricLine } from "./lyrics";

const SONGS: Record<string, string[]> = {
  "1": [
    "The city hums in violet light", "Wires humming through the night", "I follow signals to your door", "Every pulse is asking for more", "",
    "Midnight circuits, burning slow", "Carry me where the bright lights go", "Static whispers, soft and low", "Tell me all the things I know", "",
    "Hold the current, don't let go", "We're electric, head to toe", "Midnight circuits, glowing through", "Every spark leads back to you",
  ],
  "2": [
    "Turn the lamp down, let it breathe", "Shadows learn to softly weave", "Your voice is a velvet thread", "Pulling quiet through my head", "",
    "Low light, low light, stay a while", "Let the silence wear a smile", "Nothing's rushing, nothing's loud", "Just your outline in the clouds", "",
    "Dim the hours, slow the tide", "Nothing left for us to hide", "Low light, low light, hold me near", "Let the morning disappear",
  ],
  "3": [
    "Hours made of glass and rain", "Sliding down the windowpane", "I count the moments as they fall", "Silver drops along the wall", "",
    "Glass hours, shatter slow", "Let the fragile minutes go", "Every second, clear and thin", "Lets the quiet light come in", "",
    "Hold it up against the sun", "See the colours, every one", "Glass hours, shine on through", "Time looks better held by you",
  ],
  "4": [
    "Sunset leaves a crimson trace", "Fading warmth across your face", "Run the protocol again", "Count the embers, count to ten", "",
    "Afterglow, afterglow", "Tell me everything you know", "Gold and rose and burning down", "Neon dreams across the town", "",
    "Systems quiet, signals low", "Only embers set the glow", "Afterglow, don't fade away", "Stay with me to start the day",
  ],
  "5": [
    "Folded wings and tiny stars", "Drifting past the parked-up cars", "I wrote your name on every page", "Launched them all into the haze", "",
    "Paper satellites, spin and soar", "Carry what I said before", "Orbiting a quiet sky", "Waving as they pass on by", "",
    "Letters circling, soft and slow", "Do you read them? I don't know", "Paper satellites, hear me call", "Catch them if they ever fall",
  ],
  "6": [
    "Evening spills a violet hue", "Over everything we knew", "Take your time, there's no rush", "Watch the colours softly blush", "",
    "Slow violet, slow violet", "Not a worry, not a debt", "Let the dusk unfold the sky", "Let the stars come drifting by", "",
    "Breathe in blue and breathe out gold", "Every story, gently told", "Slow violet, take my hand", "Walk with me across the land",
  ],
  "7": [
    "Asphalt shimmers, mirrors bend", "Summer road with no true end", "Faces melt in waves of air", "Every mirage says you're there", "",
    "Heat haze, heat haze, take me far", "Past the dust and past the stars", "Windows down and radio loud", "Chasing silver, chasing clouds", "",
    "Burn the horizon, light it up", "Pour the sun into my cup", "Heat haze, heat haze, don't be real", "Just let me keep the way I feel",
  ],
  "8": [
    "Curtain lifts on empty rooms", "Footsteps echo, dust and gloom", "No one's waiting, no one's there", "Just a spotlight and the air", "",
    "Cold open, here we go", "Start the scene and steal the show", "Say the line before it's gone", "Roll the credits, carry on", "",
    "Frames of silver, frames of grey", "Every take a different way", "Cold open, play it through", "Find the ending, find the cue",
  ],
  "9": [
    "Petals made of radio sound", "Growing up from underground", "Tuning dial, a flower's face", "Bloom across the empty space", "",
    "Static bloom, static bloom", "Fill the silence in the room", "Crackle green and crackle bright", "Roots reach down for signal light", "",
    "Hum along with every leaf", "Wash away the disbelief", "Static bloom, open wide", "Let the music grow inside",
  ],
  "10": [
    "Platform lights begin to blur", "Whispered engines, soft and sure", "One more ticket, one more ride", "City glowing on the side", "",
    "Last train, last train to neon", "Carry every dream we're leaning on", "Windows streak in pink and blue", "Every stop looks new", "",
    "Rails are singing, wheels are spun", "Chase the lights, we've just begun", "Last train to neon, hold on tight", "We'll arrive inside the light",
  ],
};

const LEAD_IN_MS = 10_000;

export function demoLyricLines(trackId: string): LyricLine[] | null {
  const lines = SONGS[trackId];
  if (!lines) return null;
  let t = LEAD_IN_MS;
  return lines.map((text) => {
    const line = { timeMs: t, text };
    t += text ? Math.max(3800, text.length * 150) : 3200;
    return line;
  });
}
