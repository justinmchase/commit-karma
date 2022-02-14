# Fauna User Defined Functions

CreateFunction({
  name: "installation_by_repository",
  body: Query(
    Lambda(
      ["repositoryId"],
      Map(
        Paginate(
          Match(Index("unique_repository"), Var("repositoryId"))
        ),
        Lambda(
          "installation",
          Get(Var("installation"))
        )
      )
    )
  )
})
