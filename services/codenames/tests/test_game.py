import pytest

from codenames.board import Board
from codenames.game import Game, GameError
from codenames.models import CardType, Clue, Phase, Position, Team


def build_test_game(starting_team: Team = Team.RED) -> Game:
    words = [f"WORD{i}" for i in range(25)]
    assignments = (
        [CardType.RED] * 9
        + [CardType.BLUE] * 8
        + [CardType.NEUTRAL] * 7
        + [CardType.ASSASSIN]
    )
    board = Board.from_words(words, assignments)
    return Game(board, starting_team)


def test_submit_clue_switches_phase():
    game = build_test_game()
    game.submit_clue(Clue("Space", 2))
    assert game.phase is Phase.AWAIT_GUESS
    assert game.guesses_left() == 3


def test_guess_own_color_allows_continuation():
    game = build_test_game()
    game.submit_clue(Clue("Animals", 1))
    result = game.make_guess(Position(0, 0))
    assert not result.ended_turn
    assert game.guesses_left() == 1
    assert game.remaining[Team.RED] == 8


def test_guess_opponent_card_switches_turn():
    game = build_test_game()
    game.submit_clue(Clue("Opposite", 2))
    result = game.make_guess(Position(1, 4))
    assert result.ended_turn
    assert game.current_team is Team.BLUE
    assert game.phase is Phase.AWAIT_CLUE
    assert game.remaining[Team.BLUE] == 7
    assert game.remaining[Team.RED] == 9


def test_assassin_guess_ends_game():
    game = build_test_game()
    game.submit_clue(Clue("Risk", 1))
    result = game.make_guess(Position(4, 4))
    assert result.assassin_hit
    assert game.phase is Phase.FINISHED
    assert game.winner is Team.BLUE


def test_guess_limit_enforced_after_success():
    game = build_test_game()
    game.submit_clue(Clue("Solo", 0))
    result = game.make_guess(Position(0, 0))
    assert result.ended_turn
    assert game.current_team is Team.BLUE
    assert game.phase is Phase.AWAIT_CLUE


def test_end_turn_resets_phase():
    game = build_test_game()
    game.submit_clue(Clue("Pause", 2))
    game.end_turn()
    assert game.current_team is Team.BLUE
    assert game.phase is Phase.AWAIT_CLUE


def test_guess_by_word_case_insensitive():
    game = build_test_game()
    game.submit_clue(Clue("Letters", 1))
    result = game.guess_by_word("word0")
    assert result.position == Position(0, 0)


def test_guessing_without_clue_raises():
    game = build_test_game()
    with pytest.raises(GameError):
        game.make_guess(Position(0, 0))
