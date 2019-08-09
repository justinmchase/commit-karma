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
      const { action, sender, installation } = payload

      // The sender of the event, probably the same as the account
      const {
        id: senderId,
        node_id: senderNid,
        login: senderLogin
      } = sender

      // The app being installed
      const {
        id: installtionId,
        app_id: appId,
        account
      } = installation

      // The owner of the installation
      const {
        id: accountId,
        node_id: accountNid,
        login: accountLogin
      } = account

      context.log({
        eventId,
        name,
        action,
        senderId,
        senderLogin
      })
      
      const sid = await this.db.ensureUser({
        gid: senderId,
        nid: senderNid,
        login: senderLogin
      })
      const aid = await (async () => {
        if (senderId === accountId) return sid
        return this.db.ensureUser({
          gid: accountId,
          nid: accountNid,
          login: accountLogin
        })
      })()
      this.db.ensureInstallation({
        lastAction: action,
        gid: installtionId,
        appId,
        senderId: sid,
        accountId: aid
      })
    }
}