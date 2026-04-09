export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/?tab=batches",
      permanent: false,
    },
  };
}

export default function BatchesPage() {
  return null;
}
