export function generateUserId() {
  const existingId = localStorage.getItem("user_id");
  if (existingId) return existingId;

  const newId = `user_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem("user_id", newId);
  return newId;
}
