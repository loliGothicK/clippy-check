# Rust clippy-check Action

## Example workflow

```yml
clippy:
    name: clippy check
    runs-on: ubuntu-latest
    steps:
        - uses: actions/checkout@v2
        - uses: actions-rs/toolchain@v1
          with:
              toolchain: nightly
              components: clippy
              override: true
        - uses: LoliGothick/clippy-check@master
          with:
              token: ${{ secrets.GITHUB_TOKEN }}
              allow: >
                nonstandard_macro_braces
                mutex_atomic
              deny: warnings
```

## Inputs

|       Name        | Required | Description                                                                                                                             |  Type  |         Default         |
|:-----------------:|:--------:|:----------------------------------------------------------------------------------------------------------------------------------------| :----: |:-----------------------:|
|       token       |    ✔     | GitHub secret token, usually a `${{ secrets.GITHUB_TOKEN }}`.                                                                           | string |                         |
|     toolchain     |          | Rust toolchain to use .                                                                                                                 | string |         stable          |
|      target       |          | Target to run clippy on.                                                                                                                | string |                         |
|      options      |          | Options for the `cargo calippy` command.<br>`--message-format=json` is set by default.<br>Given `--message-format` is omitted silently. | string | `--message-format=json` |
|       warn        |          | Sequence for lint warnings (without `clippy::`).                                                                                        | string |                         |
|       allow       |          | Sequence for lint allowed (without `clippy::`).                                                                                         | string |                         |
|       deny        |          | Sequence for lint denied (without `clippy::`).                                                                                          | string |                         |
|      forbid       |          | Sequence for lint forbidden (without `clippy::`).                                                                                       | string |                         |
|       name        |          | Name of the created GitHub check. If running this action multiple times, each run must have a unique name.                              | string |         clippy          |
| working-directory |          | The working directory in which `carg fmt` is executed.                                                                                  | string |            .            |
