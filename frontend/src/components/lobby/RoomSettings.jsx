const RoomSettings = ({ settings, onUpdate, isHost }) => {
  if (!isHost) {
    return null;
  }

  return (
    <div className="bg-gray-700 rounded-lg p-4 mt-4">
      <h3 className="text-lg font-semibold text-white mb-3">Room Settings</h3>
      <div className="space-y-3">
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.roles.doctor}
              onChange={(e) => onUpdate({ roles: { ...settings.roles, doctor: e.target.checked } })}
              className="mr-2"
            />
            <span className="text-gray-300">Enable Doctor Role</span>
          </label>
        </div>
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.roles.detective}
              onChange={(e) => onUpdate({ roles: { ...settings.roles, detective: e.target.checked } })}
              className="mr-2"
            />
            <span className="text-gray-300">Enable Detective Role</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default RoomSettings;
