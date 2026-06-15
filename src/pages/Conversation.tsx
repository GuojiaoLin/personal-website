import { Layout } from '../components/Layout';
import { GuestbookBoard } from '../components/GuestbookBoard';

const Conversation = () => {
  return (
    <Layout>
      <main className="px-4 py-14 md:py-16">
        <GuestbookBoard />
      </main>
    </Layout>
  );
};

export default Conversation;
