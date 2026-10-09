// Synthetic educational content. Every example is fictional and for education only.
// No real people, organisations or victims' messages are used.

// Warning-sign options shown in the "spot the signs" exercise.
// ids match indicator ids returned by the analyzer.
export const SIGN_OPTIONS = [
  { id: "credential-request", label: "Asks for a secret code or password" },
  { id: "remote-access", label: "Asks me to install a remote-access app" },
  { id: "threat", label: "Threatens to block or take action" },
  { id: "urgency", label: "Pressures me to act immediately" },
  { id: "payment-demand", label: "Asks for a fee, deposit or transfer" },
  { id: "unrealistic-reward", label: "Promises a prize or guaranteed returns" },
  { id: "unusual-channel", label: "Moves me to a private chat or unusual payment" },
  { id: "family-emergency", label: "Claims a relative is in trouble" },
  { id: "impersonation", label: "Uses the name of a trusted organisation" },
  { id: "link-in-message", label: "Contains a link to open" },
  { id: "url-shortener", label: "Uses a shortened link" },
];

export const EXAMPLES = [
  {
    id: "ex-delivery",
    category: "Delivery-fee scam",
    title: "Parcel redelivery fee",
    message:
      "Your parcel could not be delivered today. Pay a small redelivery fee of Rs. 25 within 24 hours or the package will be returned. Pay here: http://parcel-redelivery-secure.example.net/pay",
    expected: ["payment-demand", "urgency", "threat", "link-in-message"],
    lesson:
      "A tiny fee feels harmless, but the payment page can collect card details. Real couriers let you track a parcel in their official app or website.",
  },
  {
    id: "ex-job",
    category: "Fake job offer",
    title: "Work-from-home data entry",
    message:
      "Congratulations! You have been selected for a work-from-home data entry job. Earn 5000 per day. Pay a refundable registration fee of Rs. 999 to confirm your seat. Contact our manager on WhatsApp to continue.",
    expected: ["unrealistic-reward", "payment-demand", "unusual-channel"],
    lesson:
      "Genuine employers do not ask you to pay to get a job. Offers that pay a lot for very little work are a classic sign.",
  },
  {
    id: "ex-kyc",
    category: "Bank / KYC impersonation",
    title: "KYC update warning",
    message:
      "Dear customer, your bank KYC is pending. Your account will be blocked today. Update immediately: http://kyc-update.securebank-help.example.org/login",
    expected: ["impersonation", "threat", "urgency", "link-in-message"],
    lesson:
      "Banks do not usually update identity details through links in messages. The real owner of that web address is example.org, not a bank.",
  },
  {
    id: "ex-otp",
    category: "OTP theft",
    title: "Fake fraud-team call follow-up",
    message:
      "This is the fraud team from your bank. We noticed a suspicious payment. Share the OTP you just received to cancel it. Your card will be blocked. Reply immediately.",
    expected: ["credential-request", "impersonation", "threat", "urgency"],
    lesson:
      "The OTP is exactly what lets a scammer approve a payment. A real bank will never ask you to read it out or send it back.",
  },
  {
    id: "ex-invest",
    category: "Investment scam",
    title: "Guaranteed trading returns",
    message:
      "Join our private trading group. Guaranteed returns of 40% weekly with zero risk. Act now, deposit Rs. 10,000 today. Message our agent on Telegram.",
    expected: ["unrealistic-reward", "payment-demand", "urgency", "unusual-channel"],
    lesson:
      "No honest investment can guarantee high returns. Pressure and private chat groups make it hard to ask for a second opinion.",
  },
  {
    id: "ex-support",
    category: "Fake customer support",
    title: "Refund through a support app",
    message:
      "Support Team: Your wallet has a pending refund of Rs. 4500. To receive it, install AnyDesk and share the 9-digit code shown so our executive can help you.",
    expected: ["remote-access", "impersonation"],
    lesson:
      "A remote-access app gives a stranger full view and control of your phone. Real refunds never need you to install one.",
  },
  {
    id: "ex-prize",
    category: "Prize scam",
    title: "Lucky draw phone",
    message:
      "Congratulations! You have won a brand-new phone in our lucky draw. To claim your prize, pay a delivery charge of Rs. 499 within 2 hours.",
    expected: ["unrealistic-reward", "payment-demand", "urgency"],
    lesson:
      "You cannot win a draw you never entered. Real prizes do not require you to pay first.",
  },
  {
    id: "ex-family",
    category: "Family-emergency impersonation",
    title: "New number, urgent money",
    message:
      "Hi Mom, this is my new number. I had an accident and I am in the hospital. Please send Rs. 15000 right now and don't tell Dad.",
    expected: ["family-emergency", "payment-demand", "urgency"],
    lesson:
      "Scammers copy a loved one's voice or style. Call the person on the number you already have before sending anything.",
  },
  {
    id: "ex-utility",
    category: "Utility threat",
    title: "Electricity disconnection notice",
    message:
      "Your electricity connection will be disconnected tonight. Pay your pending bill immediately: https://bit.ly/pay-bill-demo",
    expected: ["threat", "urgency", "link-in-message", "url-shortener"],
    lesson:
      "Short links hide the real destination. Check your bill in the official provider app or on a website you type yourself.",
  },
];

export const QUIZ = [
  {
    q: "A message from 'your bank' asks you to reply with the OTP you just received. What should you do?",
    options: [
      "Reply quickly so the account is not blocked",
      "Do not share it, and contact the bank using a number from its official app or card",
      "Share only half of the OTP",
    ],
    answer: 1,
    why: "Banks never need you to share an OTP. Anyone with it can approve payments as you.",
  },
  {
    q: "A job offer says you must pay a small registration fee to confirm your place. This is...",
    options: [
      "A normal step for most employers",
      "A common warning sign of a fake job",
      "Fine if the fee is under Rs. 1000",
    ],
    answer: 1,
    why: "Real employers do not charge you to hire you. The amount does not change that.",
  },
  {
    q: "A text says your parcel is delayed and gives a link to pay a fee. What is the safest next step?",
    options: [
      "Tap the link and check",
      "Reply STOP to the message",
      "Check the courier's official app or website, typed in yourself",
    ],
    answer: 2,
    why: "Links in unexpected messages can lead to look-alike pages. Use details you find on your own.",
  },
  {
    q: "Someone on the phone asks you to install a screen-sharing app 'to help with a refund'. You should...",
    options: [
      "Refuse, end the call and contact the company officially",
      "Install it but stay on the call",
      "Install it only on a spare phone",
    ],
    answer: 0,
    why: "Screen-sharing apps let strangers watch and control your device. Real refunds do not require them.",
  },
  {
    q: "A message from an unknown number says 'Hi Dad, new number. I am in trouble. Send money now.' What is the best response?",
    options: [
      "Send a small amount first",
      "Call your child on the number you already have",
      "Ask the sender to send a photo",
    ],
    answer: 1,
    why: "Calling a known number is the quickest way to check. Photos and voices can be faked.",
  },
  {
    q: "A scheme promises 'guaranteed 40% returns every week with no risk'. This is...",
    options: [
      "Unusual enough that you should be very careful",
      "Safe because it says guaranteed",
      "Safe if friends have joined",
    ],
    answer: 0,
    why: "Honest investments carry risk and cannot guarantee high returns. Friends can be fooled too.",
  },
  {
    q: "You think you may have been scammed. What is a helpful first step?",
    options: [
      "Delete everything so nobody sees it",
      "Feel ashamed and say nothing",
      "Contact your bank, and keep screenshots and reference numbers",
    ],
    answer: 2,
    why: "Acting early helps, and anyone can be targeted. Keeping evidence supports the bank and official reports.",
  },
];

export const CHECKLIST_STEPS = [
  { id: "contact-bank", label: "Contact my bank or payment provider using an official number" },
  { id: "change-passwords", label: "Change passwords from a device I trust (if any were shared)" },
  { id: "remove-remote", label: "Remove any remote-access or unknown apps from my device" },
  { id: "save-evidence", label: "Save screenshots, times, reference numbers and sender details" },
  { id: "report-official", label: "Report through the official cybercrime channel for my location" },
  { id: "tell-someone", label: "Tell someone I trust. Anyone can be targeted" },
];

export const PLATFORMS = [
  "Text message (SMS)",
  "Phone call",
  "Email",
  "Chat app",
  "Social media",
  "Website or online shop",
  "Payment app",
  "Other",
];

export const CREDENTIAL_OPTIONS = [
  { id: "otp", label: "A one-time code (OTP)" },
  { id: "password", label: "A password or PIN" },
  { id: "card", label: "Card details" },
  { id: "remote", label: "Remote access to my device" },
  { id: "none", label: "None of these" },
];

export const GLOSSARY = [
  ["OTP", "One-time password. A short code sent to your phone to approve a login or payment."],
  ["KYC", "Know Your Customer. A routine identity check that banks do. Real updates are done in the bank's own app or branch."],
  ["Remote-access app", "Software that lets another person see and control your screen."],
  ["Phishing", "A fake message or website made to look real so you give away details."],
];
