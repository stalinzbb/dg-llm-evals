export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/?tab=history",
      permanent: false,
    },
  };
}

export default function HistoryPage() {
  return null;
}
