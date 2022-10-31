export type User = {
  id: string;
  userName: string;
  roomName: string;
};

export default class UserService {
  private userMaps: Map<string, User>;
  constructor() {
    this.userMaps = new Map();
  }
  addUser(user: User) {
    this.userMaps.set(user.id, user);
  }
  removeUser(id: string) {
    if (this.userMaps.has(id)) {
      this.userMaps.delete(id);
    }
  }
  getUser(id: string) {
    const data = this.userMaps.get(id);
    return data || null;
  }
}
