from app import models  # noqa: F401
from app.db import Base, engine


def main() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("db_reset_ok")


if __name__ == "__main__":
    main()
