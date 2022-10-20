import { query as q } from 'faunadb'
import NextAuth, { Session } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { fauna } from '../../../services/fauna'

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: { params: { scope: 'repo read:user' } },
    }),
    // ...add more providers here
  ],
  callbacks: {
    async session(params: { session: Session }) {
      try {
        const userActiveSubscription = await fauna.query(
          q.Get(
            q.Intersection(
              q.Match(
                q.Index('subscription_by_user_ref'),
                q.Select(
                  'ref',
                  q.Get(
                    q.Match(
                      q.Index('user_by_email'),
                      q.Casefold(params.session.user?.email!)
                    )
                  )
                )
              ),
              q.Match(q.Index('subscription_by_status'), 'active')
            )
          )
        )
        return { ...params.session, activeSubscription: userActiveSubscription }
      } catch {
        return {
          ...params.session,
          activeSubscription: null,
        }
      }
    },

    async signIn({ user }) {
      const { email } = user
      try {
        await fauna.query(
          q.If(
            q.Not(
              q.Exists(
                q.Match(
                  q.Index('user_by_email'),
                  q.Casefold(user.email as string)
                )
              )
            ),
            q.Create(q.Collection('users'), { data: { email } }),
            q.Get(
              q.Match(
                q.Index('user_by_email'),
                q.Casefold(user.email as string)
              )
            )
          )
        )

        return true
      } catch {
        return false
      }
    },
  },
})
