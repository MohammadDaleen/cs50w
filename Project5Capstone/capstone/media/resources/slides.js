(function(window, document) {
    "use strict";

    var allSyllabi = Object.keys(window.SEC || {});
    var availableSyllabi = [];
    var $title = document.querySelector('.slide_title');

    if ($title) {
        var titleSyllabus = $title.dataset.extsyllabus.trim();
        var titleText = $title.querySelector('h1').textContent.trim();
        var lastSyllabus = '';
        var agenda = [];
        var $ul = document.createElement('ul');
    
        var slides = document.querySelectorAll('section.slide_content');
        
        for (var i = 0; i < slides.length; i++) {
            var $content = slides[i];
            var syl = $content.dataset.extsyllabus.trim();
    
            if (syl !== titleSyllabus && allSyllabi.indexOf(syl) >= 0) {
                availableSyllabi.push(syl);
        
                // skip repeating titles
                if (lastSyllabus !== syl) {
                    lastSyllabus = syl;
            
                    // prepare agenda-list
                    var $li = document.createElement('li');
                    $li.textContent = SEC[syl];
                    $li.dataset.syllabus = syl;
                    $ul.appendChild($li);
            
                    agenda.push({
                        syllabus: syl,
                        title: SEC[syl],
                        node: $content
                    });
                }
            }
        }
    
        var template = '<section class="slide_agenda">\n' +
            '<div class="header"><h1><span class="syllabus">' + titleSyllabus + '</span>\n<br/>\n' +
            '</h1></div><hr/><div class="agenda">' + $ul.outerHTML +
            '</div></section>';
    
        var $section = document.createElement('div');
        $section.innerHTML = template;
        $section = $section.firstChild;
        $section.querySelector('h1').appendChild(document.createTextNode(titleText));
        window.$section = $section;
    
        agenda.forEach(function (topic) {
            var $node = topic.node.parentNode.insertBefore($section.cloneNode(true), topic.node);
            $node.dataset.extsyllabus = topic.syllabus;
            var listEntry = $node.querySelector('li[data-syllabus="' + topic.syllabus + '"]');
            if (listEntry) {
                listEntry.classList.add('active');
            }
        });
    
        var sections = document.querySelectorAll('section');
        for (var i = 0; i < sections.length; i++) {
            sections[i].dataset.slideNumber = i + 1;
        }
    }
} (window, document));