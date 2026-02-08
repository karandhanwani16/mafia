const RoomSettings = ({ settings, onUpdate, isHost }) => {
  if (!isHost) {
    return null;
  }

  return (
    <div className="bg-mafia-surface border-2 border-mafia-border rounded-lg p-4 mt-4">
      <h3 className="font-display text-lg font-semibold text-mafia-gold mb-3">Room Settings</h3>
      <div className="space-y-3">
        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.roles.doctor}
              onChange={(e) => onUpdate({ roles: { ...settings.roles, doctor: e.target.checked } })}
              className="mr-2 accent-mafia-gold"
            />
            <span className="text-mafia-cream">Enable Doctor Role</span>
          </label>
        </div>
        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.roles.detective}
              onChange={(e) => onUpdate({ roles: { ...settings.roles, detective: e.target.checked } })}
              className="mr-2 accent-mafia-gold"
            />
            <span className="text-mafia-cream">Enable Detective Role</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default RoomSettings;
