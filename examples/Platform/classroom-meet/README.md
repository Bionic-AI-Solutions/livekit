<a href="https://livekit.io/">
  <img src="https://livekit.io/images/livekit-mark.png" alt="LiveKit logo" width="100" height="100">
</a>

# LiveKit Classroom Meet

<p>
  <a href="https://github.com/livekit/components-js">LiveKit Components</a>
  •
  <a href="https://docs.livekit.io/">LiveKit Docs</a>
  •
  <a href="https://livekit.io/cloud">LiveKit Cloud</a>
</p>

<br>

LiveKit Classroom Meet is an open source video conferencing app built specifically for educational use cases. It's built on [LiveKit Components](https://github.com/livekit/components-js), [LiveKit Cloud](https://cloud.livekit.io/), and Next.js.

## Features

- **Teacher/Student Roles**: Role-based access control with different permissions
- **Teacher Controls**: 
  - Mute all students
  - Screen sharing
  - Recording controls
  - Participant management
- **Student Features**:
  - Hand raising
  - Chat messaging
  - Screen sharing (with teacher approval)
- **Classroom UI**: Optimized layout for educational sessions
- **Real-time Collaboration**: Built on LiveKit's real-time infrastructure

## Tech Stack

- This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
- App is built with [@livekit/components-react](https://github.com/livekit/components-js/) library.
- Uses [livekit-server-sdk](https://github.com/livekit/livekit-server-sdk) for token generation.

## Prerequisites

- Node.js 18+ and pnpm
- LiveKit server (cloud or self-hosted)
- LiveKit API key and secret

## Dev Setup

Steps to get a local dev setup up and running:

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Copy `.env.example` in the project root and rename it to `.env.local`.

3. Update the environment variables in `.env.local`:
   ```env
   LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=your-api-key
   LIVEKIT_API_SECRET=your-api-secret
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Visit [http://localhost:3000](http://localhost:3000) to see the result.

6. Start your classroom session! 🎓

## Usage

### Creating a Classroom

1. Navigate to the home page
2. Enter your name and select your role (Teacher or Student)
3. Click "Create Classroom" (for teachers) or "Join Classroom" (for students)
4. Share the room name with students

### Teacher Features

- **Mute All**: Mute all students at once
- **Screen Share**: Share your screen with the class
- **Recording**: Start/stop recording the session
- **Participant Management**: View and manage all participants

### Student Features

- **Hand Raise**: Raise your hand to ask questions
- **Chat**: Send messages to the class
- **Screen Share**: Share your screen (requires teacher approval)

## Project Structure

```
classroom-meet/
├── app/
│   ├── api/
│   │   └── connection-details/
│   │       └── route.ts          # Token generation with role support
│   ├── classroom/
│   │   └── [roomName]/
│   │       ├── page.tsx          # Classroom room page
│   │       └── ClassroomClient.tsx  # Main classroom component
│   ├── layout.tsx
│   └── page.tsx                  # Home page
├── components/
│   ├── ClassroomControls.tsx     # Teacher controls
│   ├── HandRaiseButton.tsx       # Student hand raise
│   └── ParticipantList.tsx       # Participant list with roles
└── lib/
    └── utils.ts                  # Utility functions
```

## Learn More

- [LiveKit Documentation](https://docs.livekit.io/)
- [LiveKit Components](https://github.com/livekit/components-js)
- [Next.js Documentation](https://nextjs.org/docs)

## License

This project is open source and available under the Apache License 2.0.

