import { useNavigate } from 'react-router-dom';
import ErrorState from '../components/common/ErrorState';

const catImageUrl = '/images/cat-error.jpg';

export default function ErrorPage({
  title = '404 - Page Not Found',
  subTitle = "Oops! The page you're looking for doesn't exist or has been moved."
}) {
  const navigate = useNavigate();

  return (
    <ErrorState
      title={title}
      subtitle={subTitle}
      image={catImageUrl}
      imageAlt="Curious Cat"
      actionLabel="Go to Homepage"
      onAction={() => navigate('/')}
    />
  );
}
