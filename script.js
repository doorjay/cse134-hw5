// global array to track all errors across attempts
const form_errors = []; 

// Project data 
const PROJECT_CARDS_DATA = [
    {
        id: 'example-1',
        title: 'Example Project 1',
        imageSmall: 'images/project1-small.jpg',
        imageLarge: 'images/project1.jpg',
        imageAlt: 'A photo of project 1',
        description: 'A responsive website built with HTML, CSS, and JavaScript that showcases my résumé and personal projects.',
        tags: ['HTML', 'CSS', 'JavaScript']
    },
    {
        id: 'example-2',
        title: 'Example Project 2',
        imageSmall: 'images/project2-small.jpg',
        imageLarge: 'images/project2.jpg',
        imageAlt: 'A photo of project 2',
        description: 'A sample project with a short description to demonstrate reusable cards.',
        tags: ['Tag 1', 'Tag 2', 'Tag 3']
    },
    {
        id: 'example-3',
        title: 'Example Project 3',
        imageSmall: 'images/project3-small.jpg',
        imageLarge: 'images/project3.jpg',
        imageAlt: 'A photo of project 3',
        description: 'Another example project that highlights my work on layouts and design.',
        tags: ['Layout', 'Design', 'Practice']
    }
];


document.addEventListener('DOMContentLoaded', () => {
    setupThemeToggle();
    setupViewTransions();
    setupContactFormJS();
    setupProjectsPage();
}); 

// Contact Form Validation
function setupContactFormJS() {
    const form = document.querySelector('#contact-form'); 
    if (!form) return; // Not on the JS form page

    const nameField = form.querySelector('#name');
    const emailField = form.querySelector('#email'); 
    const messageField = form.querySelector('#message'); 
    const errorOutput = form.querySelector('#error-output');
    const infoOutput = form.querySelector('#info-output');

    // reset output initially
    if (errorOutput) errorOutput.textContent = '';
    if (infoOutput) infoOutput.textContent = '';


    // ERROR LOGGER
    const errorLogField = document.querySelector('#form-errors-field');

    function logError(field, message) {
        form_errors.push({
            field: field.name || field.id,
            value: field.value,
            message: message,
            time: new Date().toISOString()
        });
    }



    // MASKING
    // prevent illegal characters based on pattern
    nameField.addEventListener('input', () => {
        const pattern = new RegExp(nameField.pattern);
        const value = nameField.value;

        // If the whole value no longer matches the allowed pattern
        if (!pattern.test(value)) {
            // Remove the last typed character
            nameField.value = value.slice(0, -1);

            // Flash field (visual feedback)
            nameField.classList.add('field-flash');
            setTimeout(() => {
                nameField.classList.remove('field-flash');
            }, 200);

            logError(nameField, "Illegal character typed");
        }
    });


    // Character count warning in message field
    const charCountSpan = document.querySelector('#char-count');
    const maxChars = messageField.maxLength;

    function updateCharacterCount() {
        const currentLength = messageField.value.length;
        const remaining = maxChars - currentLength;

        // Update the label's inline countdown
        charCountSpan.textContent = `(${remaining} left)`;

        // Warning when near limit
        if (remaining <= 50) {
            charCountSpan.style.color = "crimson";
            charCountSpan.style.fontWeight = "600";
        } else {
            charCountSpan.style.color = "";
            charCountSpan.style.fontWeight = "";
        }

        // Prevent exceeding the limit (copy/paste)
        if (currentLength > maxChars) {
            messageField.value = messageField.value.slice(0, maxChars);
        }
    }

    // Update on input
    messageField.addEventListener('input', updateCharacterCount);

    // Show initial value on load
    updateCharacterCount();


    // VALIDATION
    // Helper to set a custom message based on validity state
    function setMessageForField(field) {
        field.setCustomValidity(''); // clear old message

        if (field === nameField) {
            if (field.validity.valueMissing) {
                field.setCustomValidity('Please enter your name.');
            }
            else if (field.validity.tooShort) {
                field.setCustomValidity('Name must be at least 2 characters long.'); 
            }
        }

        if (field === emailField) {
            if (field.validity.valueMissing) {
                field.setCustomValidity('Email is required.');
            }
            else if (field.validity.tooShort) {
                field.setCustomValidity('Please enter a valid email adress.'); 
            }
        }

        if (field === messageField) {
            if (field.validity.valueMissing) {
                field.setCustomValidity('Please enter a message.');
            }
            else if (field.validity.tooShort) {
                field.setCustomValidity('Message is too short. Please write a bit more.'); 
            }
        }
    }

    // Helper to show the message for the first invalid field in errorOutput
    function showFirstErrorMessage() {
        if (!errorOutput) return;

        // Order matters: name → email → message
        const fields = [nameField, emailField, messageField];

        for (const field of fields) {
            if (!field.checkValidity()) {
                errorOutput.textContent = field.validationMessage;
                return;
            }
        }   

        // If everything is valid, clear the error area
        errorOutput.textContent = '';
    }

    // Validate each field when it loses focus
    [nameField, emailField, messageField].forEach(field => {
        field.addEventListener('blur', () => {
            setMessageForField(field);
            field.checkValidity();
            if (!field.checkValidity()) {
                logError(field, field.validationMessage);
            }
            showFirstErrorMessage();
        });

        // Also respond while typing (so messages go away as they fix issues)
        field.addEventListener('input', () => {
            setMessageForField(field);
            field.checkValidity();
            showFirstErrorMessage();
        });
    });

    // Handle submit
    form.addEventListener('submit', (event) => {
        // Make sure all fields get their custom messages
        [nameField, emailField, messageField].forEach(setMessageForField);

        // If form is invalid, prevent submit and show first error
        if (!form.checkValidity()) {
            event.preventDefault();

            [nameField, emailField, messageField].forEach(field => {
                if (!field.checkValidity()) {
                    logError(field, field.validationMessage);
                }
            });

            showFirstErrorMessage();
        }

        // if form is valid, save error history into hidden field
        if (errorLogField) {
            errorLogField.value = JSON.stringify(form_errors);
        }

    });

}

function setupThemeToggle() {
    const toggle = document.querySelector('#theme-toggle'); 
    if (!toggle) return; 

    const savedTheme = localStorage.getItem('preferred-theme');

    if (savedTheme === 'dark') {
        toggle.checked = true; 
    }
    else if (savedTheme === 'light') {
        toggle.checked = false;
    }

    toggle.addEventListener('change', () => {
        const theme = toggle.checked ? 'dark' : 'light';
        localStorage.setItem('preferred-theme', theme);
    });
}

// Custom element for a single project card
class ProjectCard extends HTMLElement
{
    constructor()
    {
        super();
        this._data = null;
    }

    // Allow setting data via JS: card.data = {...}
    set data(value)
    {
        this._data = value;
        this.render();
    }

    get data()
    {
        return this._data;
    }

    connectedCallback()
    {
        // If data was not set programmatically, allow light attribute usage
        if (!this._data)
        {
            const title = this.getAttribute('title');

            if (title)
            {
                this._data = {
                    id: this.getAttribute('id') || '',
                    title: title,
                    imageSmall: this.getAttribute('image-small') || '',
                    imageLarge: this.getAttribute('image-large') || '',
                    imageAlt: this.getAttribute('image-alt') || '',
                    description: this.textContent.trim(),
                    tags: []
                };
            }
        }

        this.render();
    }

    // Build the card
    render()
    {
        if (!this._data)
        {
            return;
        }

        // Clear existing children
        this.textContent = '';

        const {
            title,
            imageSmall,
            imageLarge,
            imageAlt,
            description,
            tags
        } = this._data;

        // <article class="project-card">
        const article = document.createElement('article');
        article.classList.add('project-card');

        // <picture> with <source> and <img>
        const picture = document.createElement('picture');

        if (imageSmall || imageLarge)
        {
            const source = document.createElement('source');
            const srcsetParts = [];

            if (imageSmall)
            {
                srcsetParts.push(`${imageSmall} 480w`);
            }

            if (imageLarge)
            {
                srcsetParts.push(`${imageLarge} 800w`);
            }

            if (srcsetParts.length > 0)
            {
                source.setAttribute('srcset', srcsetParts.join(', '));
                source.setAttribute('sizes', '(min-width: 700px) 90vw, 200px');
                source.setAttribute('type', 'image/jpeg');
                picture.appendChild(source);
            }

            const img = document.createElement('img');
            img.src = imageSmall || imageLarge || '';
            img.alt = imageAlt || '';
            img.loading = 'lazy';
            img.decoding = 'async';

            picture.appendChild(img);
        }

        // Text content section 
        const bodySection = document.createElement('section');
        bodySection.classList.add('card-body');

        const heading = document.createElement('h2');
        heading.textContent = title;
        bodySection.appendChild(heading);

        if (description)
        {
            const paragraph = document.createElement('p');
            paragraph.textContent = description;
            bodySection.appendChild(paragraph);
        }

        // “Learn more” link – for now just uses a placeholder
        const link = document.createElement('a');
        link.href = '#';
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'Learn more';
        bodySection.appendChild(link);

        // Tags list if provided
        if (Array.isArray(tags) && tags.length > 0)
        {
            const tagList = document.createElement('ul');
            tagList.classList.add('tags');

            tags.forEach((tagText) =>
            {
                const li = document.createElement('li');
                li.textContent = tagText;
                tagList.appendChild(li);
            });

            bodySection.appendChild(tagList);
        }

        // Put everything together in the article
        article.appendChild(picture);
        article.appendChild(bodySection);

        // Attach article to the custom element
        this.appendChild(article);
    }
}

// Register <project-card>
customElements.define('project-card', ProjectCard);

function setupProjectsPage() 
{
    const cardsSection = document.querySelector('#project-cards');

    // not on projects page
    if (!cardsSection)
    {
        return;
    }

    // Clear any existing content 
    cardsSection.textContent = '';

    // Create a <project-card> for each project in our data array
    PROJECT_CARDS_DATA.forEach((project) => 
    {
        const cardElement = document.createElement('project-card');
        cardElement.data = project;
        cardsSection.appendChild(cardElement);
    });
}


function setupViewTransions() {
    // No API? Don't try to transition stuff
    if (!document.startViewTransition) return;

    // Helper to update active nav link based on the URL path
    function updateActiveNav(pathname) {
        const page = pathname.split('/').pop() || 'index.html';

        document.querySelectorAll('nav a').forEach((link) => {
            const href = link.getAttribute('href');
            if (!href) return;
            const hrefPage = href.split('/').pop();

            if (hrefPage === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[data-view-transition]');
        if (!link) return;

        const url = new URL(link.href);

        // Only handle same-origin, same-site navigation
        if (url.origin !== window.location.origin) return;

        event.preventDefault();

        document.startViewTransition(async () => {
            const response = await fetch(url.href, {
                headers: { 'X-Requested-With': 'view-transition' }
            });

            const html = await response.text();

            const parser = new DOMParser();
            const newDoc = parser.parseFromString(html, 'text/html');

            const newMain = newDoc.querySelector('main');
            const currentMain = document.querySelector('main');
            const newTitle = newDoc.querySelector('title');

            if (newMain && currentMain) {
                currentMain.replaceWith(newMain);
            }

            if (newTitle) {
                document.title = newTitle.textContent;
            }

            // Update URL and active nav styling
            window.history.pushState(null, '', url.pathname);
            updateActiveNav(url.pathname);

            // Re-initialize JS behaviors for the new content
            setupContactFormJS();
            setupProjectsPage();
        });
    });

    // Fallback for browser back/forward buttons: full reload is fine
    window.addEventListener('popstate', () => {
        window.location.reload();
    });
}