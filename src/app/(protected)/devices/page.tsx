import { Devices } from '@/pages/Devices';

interface Props {
  searchParams: { status?: string; asig?: string };
}

export default function DevicesPage({ searchParams }: Props) {
  return (
    <Devices
      key={`${searchParams.status ?? ''}-${searchParams.asig ?? ''}`}
      initialStatus={searchParams.status}
      initialAsig={searchParams.asig}
    />
  );
}