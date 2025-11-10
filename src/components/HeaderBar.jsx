import PropTypes from 'prop-types';
import './HeaderBar.css';

function HeaderBar({ profile }) {
  return (
    <header className="header">
      <div>
        <h2 className="header__patient">{profile.name}</h2>
        <span className="header__meta">Last refreshed: {profile.lastRefresh}</span>
      </div>
      <div className="header__info">
        <div>
          <strong>Information</strong>
          <ul>
            <li>Age: {profile.age}</li>
            <li>Condition: {profile.primaryCondition}</li>
            <li>Care team: {profile.careTeam}</li>
          </ul>
        </div>
        <div className="header__avatar" aria-label="Patient avatar">
          {profile.name.slice(0, 2)}
        </div>
      </div>
    </header>
  );
}

HeaderBar.propTypes = {
  profile: PropTypes.shape({
    name: PropTypes.string.isRequired,
    lastRefresh: PropTypes.string.isRequired,
    age: PropTypes.number.isRequired,
    primaryCondition: PropTypes.string.isRequired,
    careTeam: PropTypes.string.isRequired
  }).isRequired
};

export default HeaderBar;
