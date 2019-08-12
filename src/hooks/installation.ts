import { Database } from "../data/database";
import { Application, Context } from "probot";

export class Installation {
  constructor(
    private readonly db: Database,
    private readonly app: Application) {
      this.app.on('installation', this.hook.bind(this))
    }

    public async hook(context: Context) {
      const { id: eventId, name, payload } = context
      const {
        action,
        sender: {
          id: sid,
          node_id: snid,
          login: slogin
        },
        installation: {
          id: iid,
          app_id: appId,
          // account: {
          //   id: aid,
          //   node_id: anid,
          //   login: 
          // }
        }
      } = payload

      context.log({
        eventId,
        name,
        action,
        senderId: sid,
        senderLogin: slogin
      })

      const senderId = await this.db.ensureUser({
        gid: sid,
        nid: snid,
        login: slogin
      })
      await this.db.ensureInstallation({
        lastAction: action,
        gid: iid,
        appId,
        senderId
      })
    }
}