$(document).ready(function () {
    var TOTAL = 10;

    var DICTIONARY = [
        { en: 'always',    ua: ['завжди'] },
        { en: 'never',     ua: ['ніколи'] },
        { en: 'house',     ua: ['дім', 'будинок', 'хата'] },
        { en: 'water',     ua: ['вода'] },
        { en: 'friend',    ua: ['друг', 'приятель', 'подруга'] },
        { en: 'book',      ua: ['книга', 'книжка'] },
        { en: 'window',    ua: ['вікно'] },
        { en: 'apple',     ua: ['яблуко'] },
        { en: 'street',    ua: ['вулиця'] },
        { en: 'beautiful', ua: ['гарний', 'красивий', 'прекрасний', 'гарна', 'красива'] },
        { en: 'sun',       ua: ['сонце'] },
        { en: 'school',    ua: ['школа'] },
        { en: 'city',      ua: ['місто'] },
        { en: 'dog',       ua: ['собака', 'пес'] },
        { en: 'cat',       ua: ['кіт', 'кішка', 'котик'] },
        { en: 'tree',      ua: ['дерево'] },
        { en: 'table',     ua: ['стіл'] },
        { en: 'happy',     ua: ['щасливий', 'радісний', 'щаслива'] },
        { en: 'bread',     ua: ['хліб'] },
        { en: 'night',     ua: ['ніч'] }
    ];

    var LEVELS = [
        { min: 90, code: 'C1', name: 'Просунутий',      text: 'Чудовий результат! Ви впевнено володієте лексикою.' },
        { min: 70, code: 'B2', name: 'Вище середнього', text: 'Дуже добре! Лишилось підтягнути кілька слів.' },
        { min: 50, code: 'B1', name: 'Середній',        text: 'Непогано. Базова лексика засвоєна, продовжуйте практику.' },
        { min: 30, code: 'A2', name: 'Базовий',         text: 'Є база, але слів потрібно вивчити більше.' },
        { min: 0,  code: 'A1', name: 'Початковий',      text: 'Тільки початок шляху. Повторіть слова та спробуйте ще раз!' }
    ];

    var UA_REGEXP = /^[а-щьюяєіїґ' -]+$/;

    var $card     = $('#card');
    var $word     = $('#word');
    var $feedback = $('#feedback');
    var $step     = $('#step');
    var $prev     = $('#prev');
    var $next     = $('#next');
    var $form     = $('#answer-form');
    var $answer   = $('#answer');
    var $error    = $('#error');
    var $ok       = $('#stat-ok');
    var $bad      = $('#stat-bad');
    var $modal    = $('#modal');

    var words = [];   
    var current = 0;  

    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }
        return a;
    }

    function normalize(str) {
        return $.trim(str)
            .toLowerCase()
            .replace(/[’ʼ`‘]/g, "'")
            .replace(/\s+/g, ' ');
    }

    function validate(value) {
        if (value === '') {
            return 'Введіть переклад слова.';
        }
        if (!UA_REGEXP.test(value)) {
            return 'Дозволені лише українські літери, пробіл, дефіс та апостроф.';
        }
        if (value.replace(/[' -]/g, '') === '') {
            return 'Переклад має містити літери.';
        }
        return '';
    }

    function showError(message) {
        $answer.addClass('is-invalid').attr('aria-invalid', 'true');
        $error.stop(true, true).text(message).fadeIn(150);
    }

    function hideError() {
        $answer.removeClass('is-invalid').removeAttr('aria-invalid');
        $error.stop(true, true).hide().text('');
    }

    function countAnswered() {
        return $.grep(words, function (w) { return w.answered; }).length;
    }

    function countCorrect() {
        return $.grep(words, function (w) { return w.answered && w.correct; }).length;
    }

    function render() {
        var w = words[current];

        $word.text(w.en);
        $step.text((current + 1) + '/' + words.length);

        $card
            .removeClass('is-correct is-wrong')
            .toggleClass('is-correct', w.answered && w.correct)
            .toggleClass('is-wrong', w.answered && !w.correct);

        if (!w.answered) {
            $feedback.text('');
        } else if (w.correct) {
            $feedback.text('Вірно!');
        } else {
            $feedback.text('Невірно. Правильно: ' + w.ua[0]);
        }

        hideError();
        $answer
            .val(w.answered ? w.userAnswer : (w.draft || ''))
            .prop('disabled', w.answered);

        $prev.prop('disabled', current === 0);
        $next.prop('disabled', current === words.length - 1);

        var okCount = countCorrect();
        $ok.text(okCount);
        $bad.text(countAnswered() - okCount);
    }

    function go(direction) {
        var target = current + direction;
        if (target < 0 || target >= words.length) {
            return;
        }
        words[current].draft = $answer.val();
        current = target;

        $card.stop(true, true).fadeTo(120, 0, function () {
            render();
            $card.fadeTo(120, 1);
            if (!words[current].answered && window.matchMedia('(hover: hover)').matches) {
                $answer.trigger('focus');
            }
        });
    }

    function checkAnswer() {
        var w = words[current];
        if (w.answered) {
            return;
        }

        var value = normalize($answer.val());
        var message = validate(value);
        if (message) {
            showError(message);
            $answer.trigger('focus');
            return;
        }

        w.userAnswer = $.trim($answer.val());
        w.correct = $.inArray(value, w.ua) !== -1;
        w.answered = true;
        render();

        if (countAnswered() === words.length) {
            setTimeout(showResult, 900);
        }
    }

    function getLevel(percent) {
        var found = LEVELS[LEVELS.length - 1];
        $.each(LEVELS, function (i, level) {
            if (percent >= level.min) {
                found = level;
                return false;
            }
        });
        return found;
    }

    function showResult() {
        var total = words.length;
        var correct = countCorrect();
        var percent = Math.round(correct / total * 100);
        var level = getLevel(percent);

        $('#modal-level').text(level.code);
        $('#modal-name').text(level.name);
        $('#modal-score').text('Вірно: ' + correct + ' з ' + total + ' (' + percent + '%)');
        $('#modal-text').text(level.text);

        $('body').addClass('modal-open');
        $modal.attr('aria-hidden', 'false').css('display', 'flex').hide().fadeIn(250);
        $('#modal-restart').trigger('focus');
    }

    function closeModal() {
        $modal.fadeOut(200).attr('aria-hidden', 'true');
        $('body').removeClass('modal-open');
    }

    function start() {
        words = $.map(shuffle(DICTIONARY).slice(0, TOTAL), function (item) {
            return {
                en: item.en,
                ua: item.ua,
                answered: false,
                correct: false,
                userAnswer: '',
                draft: ''
            };
        });
        current = 0;
        $card.stop(true, true).css('opacity', 1);
        render();
    }

    $card.on('click', checkAnswer);

    $card.on('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            checkAnswer();
        }
    });

    $form.on('submit', function (e) {
        e.preventDefault();
        checkAnswer();
    });

    $answer.on('input', hideError);

    $prev.on('click', function () { go(-1); });
    $next.on('click', function () { go(1); });

    $('#restart, #modal-restart').on('click', function () {
        closeModal();
        start();
    });

    $('#modal-close').on('click', closeModal);

    $modal.on('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && $modal.is(':visible')) {
            closeModal();
        }
    });

    start();
});
