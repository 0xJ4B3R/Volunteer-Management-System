import './styles/Profile.css'; // Or use 'Card.module.css' if using CSS Modules

const Profile = () => {
  return (
    <div className="card">
      <div className="card-photo"></div>
      <div className="card-title">
        JOHN DOE <br />
        <span>Fullstack dev &amp; UX UI</span>
      </div>
      <div className="card-socials">
        <button className="card-socials-btn facebook">
          <svg className="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M16.75,9H13.5V7a1,1,0,0,1,1-1h2V3H14a4,4,0,0,0-4,4V9H8v3h2v9h3.5V12H16Z" />
          </svg>
        </button>
        <button className="card-socials-btn github">
          <svg viewBox="0 0 24 24" height="33" width="33" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0...z" />
          </svg>
        </button>
        <button className="card-socials-btn linkedin">
          <svg height="512" width="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path d="M51.326 185.85h90.011v270.872h-90.011z...z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Profile;
