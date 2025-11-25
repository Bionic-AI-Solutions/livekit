import { ClassroomClient } from './ClassroomClient';

export default async function ClassroomPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomName: string }>;
  searchParams: Promise<{ name?: string; role?: string }>;
}) {
  const _params = await params;
  const _searchParams = await searchParams;
  const name = _searchParams.name || 'Participant';
  const role = (_searchParams.role || 'student') as 'teacher' | 'student';

  return (
    <ClassroomClient
      roomName={_params.roomName}
      participantName={name}
      role={role}
    />
  );
}

