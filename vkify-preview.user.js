// ==UserScript==
// @name         VKify 03.05.25 Preview
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  vkify update preview
// @author       koke228
// @match        *://ovk.to/*
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';
if (!(document.querySelector('body[data-themepack="vkify"]'))) {return;}

// новы уведы
window.notificationStack = [];

window.NewNotification = function (title, body, avatar = null, callback = () => {}, time = 5000, count = true) {
    if(avatar != null) {
        avatar = '<avatar>' +
            '<img src="' + avatar + '">' +
        '</avatar>';
    } else {
        avatar = '';
    }
    counter += 1;
    let id = counter;
    let notification = u(
    `<div class="notification_ballon notification_ballon_wrap" id="n${id}">
        <notification_title>
            ${title}
            <div class="notif_close_bg"><a class="close"></a></div>
        </notification_title>
        <wrap>
            ${avatar}
            <content style="max-width: 243px;">
                ${body}
            </content>
        </wrap>
    </div>
    `);

    u(".notifications_global_wrap").append(notification);

    notificationStack.push({
        id: id,
        element: u("#n" + id)
    });

    updateNotifPos();

    function getPrototype() {
        return u("#n"+id);
    }

    function __closeNotification() {
        if(document.visibilityState != "visible")
            return setTimeout(() => {__closeNotification()}, time);

        notificationStack = notificationStack.filter(item => item.id !== id);
        getPrototype().addClass('disappears');

        setTimeout(() => {
            getPrototype().remove();
            updateNotifPos();
        }, 500);
    }

    if(count == true) {
        counter++;
    document.title = document.title.replace(/^\([0-9]+\) /, "");
        document.title = `(${counter}) ${document.title}`;
    }

    setTimeout(() => {__closeNotification()}, time);
    notification.children('notification_title').children('.notif_close_bg').on('click', function(e) {
        e.stopPropagation();
        __closeNotification();
    });

    notification.on('click', function(e) {
        if (!u(this).hasClass('disappears') && !(e.target.tagName === 'A' || u(e.target).closest('a').length > 0)) {
            Reflect.apply(callback, {
                closeNotification: () => __closeNotification(),
                $notification:     () => getPrototype()
            }, [e]);
            __closeNotification();
        }
    });
}

function updateNotifPos() {
    let currentOffset = 0;

    for (let i = notificationStack.length - 1; i >= 0; i--) {
        const item = notificationStack[i];
        const element = item.element;

        const height = element.nodes[0].offsetHeight || 95;

        element.attr('style',
            `position: absolute;
             bottom: ${currentOffset}px;
             transition: bottom 0.4s ease;`
        );
        currentOffset += height + 10;
    }
}
window.grabName = function() {
if (window.cur.type === 'profile') {
    const name = `${window.cur.first_name} ${window.cur.last_name}`;
    const location = window.location.pathname + window.location.search + window.location.hash;
    NewNotification("Новое сообщение",`<a style="margin-right: 5px" href="/id21908">Dr. Dre</a>Его зовут ${escapeHtml(name)}<br>Ссылка сюда: <a href="${escapeHtml(location)}">${escapeHtml(location)}</a>`, 'https://kaslana.ovk.to/hentai/fd/fd71352e547458f772adf771d969b4919b4fe289e9f559d4b0b74d8d48020be8c2a79bb2b43a945ab6d5ea1f35894fdd90fa7ebbb3abff806e29b43df49e4d40.jpeg', () => {window.open('/im?sel=21908', '_blank').focus();}, 99999, true);
}}

window.cur = {};

//document.addEventListener("DOMContentLoaded", () => {
  window.cur.type = document.querySelector('meta[property="og:type"]')?.content ?? 'other';
  window.cur.first_name = document.querySelector('meta[property="og:first_name"]')?.content ?? '';
  window.cur.last_name = document.querySelector('meta[property="og:last_name"]')?.content ?? '';
  window.cur.url = document.querySelector('meta[property="og:url"]')?.content ?? '';
  window.grabName();
//});

function isUserSection(url) {
    console.log(url)
    if (/^\/(gifts|albums|audios|friends|videos|notes|wall|groups)\d+/.test(url)) {
        return true;
    }
    if (/^\/friends\d+\?act=online$/.test(url)) {
        return true;
    }
    return false;
}

u('body').on('click', function(event) {
    if (!u(event.target).closest('.sidebar .navigation').length) {
        window.cur.ignoreheadlink = false;
    } else {
        window.cur.ignoreheadlink = true;
		}
});

window.router.route = async function(params = {}) {
        if(typeof params == 'string') {
            params = {
                url: params
            }
        }

        const old_url = location.href
        let url = params.url
        if(url.indexOf(location.origin)) {
            url = location.origin + url
        }

        if((localStorage.getItem('ux.disable_ajax_routing') ?? 0) == 1 || window.openvk.current_id == 0) {
            window.location.assign(url)
            return
        }

        if(this.prev_page_html && this.prev_page_html.pathname != location.pathname) {
            this.prev_page_html = null
        }

        const push_url = params.push_state ?? true
        const next_page_url = new URL(url)
        if(push_url) {
            history.pushState({'from_router': 1}, '', url)
        } else {
            history.replaceState({'from_router': 1}, '', url)
        }

        const parser = new DOMParser
        const next_page_request = await fetch(next_page_url, {
            method: 'AJAX',
            referrer: old_url,
            headers: {
                'X-OpenVK-Ajax-Query': '1',
            }
        })
        const next_page_text = await next_page_request.text()
        const parsed_content = parser.parseFromString(next_page_text, 'text/html')
        console.log(parsed_content);
        if(next_page_request.redirected) {
            history.replaceState({'from_router': 1}, '', next_page_request.url)
        }

        this.__closeMsgs()
        this.__unlinkObservers()

        try {
            window.cur.prev_url = window.cur.url;
            this.__appendPage(parsed_content)
            await this.__integratePage()
            if (isUserSection(document.location.pathname) && !window.cur.ignoreheadlink && window.cur.first_name && window.cur.url) {
              document.querySelector('.headBack').style = "display: block";
              document.querySelector('#search_box').style = "display: none";
              document.querySelector('.headBack a').innerText = escapeHtml(`${window.cur.first_name} ${window.cur.last_name}`);
              document.querySelector('.headBack a').href = `${(new URL(window.cur.prev_url)).pathname + (new URL(window.cur.prev_url)).search + (new URL(window.cur.prev_url)).hash}`;
            } else {
              document.querySelector('.headBack').style = "display: none";
              document.querySelector('#search_box').style = "display: block";
            }
            window.cur.type = parsed_content.querySelector('meta[property="og:type"]')?.content ?? 'other';
            window.cur.first_name = parsed_content.querySelector('meta[property="og:first_name"]')?.content ?? '';
            window.cur.last_name = parsed_content.querySelector('meta[property="og:last_name"]')?.content ?? '';
            window.cur.url = parsed_content.querySelector('meta[property="og:url"]')?.content ?? '';
        } catch(e) {
            console.error(e)
            next_page_url.searchParams.delete('al', 1)
            location.assign(next_page_url)
        }
        // чюток превью сообщений
        console.log(parsed_content);
        grabName();
        document.querySelector('.sidebar .navigation a[href="/im"]').insertAdjacentHTML('beforeend', `<object type="internal/link" class="im_pad">+</object>`);
};



if (Math.floor(Math.random() * 101) > 50)
setTimeout(() => {NewNotification("Новое сообщение",`<a style="margin-right: 5px" href="/id21908">Dr. Dre</a>${escapeHtml('Привет, у тебя еще нет наушников как у меня? Заказывай скорее за 990р')}`, 'https://kaslana.ovk.to/hentai/fd/fd71352e547458f772adf771d969b4919b4fe289e9f559d4b0b74d8d48020be8c2a79bb2b43a945ab6d5ea1f35894fdd90fa7ebbb3abff806e29b43df49e4d40.jpeg', () => {window.open('/im?sel=21908', '_blank').focus();}, 99999, true)}, 5000)

// ещё превью сообщений
document.querySelector('.sidebar .navigation a[href="/im"]').insertAdjacentHTML('beforeend', `<object type="internal/link" class="im_pad">+</object>`);
document.querySelector('.sidebar .navigation a[href="/im"] .im_pad').onclick = function(e) {e.preventDefault();}
const im_padHTML = async function () {
	function formatDate(unixtime) {
		const date = new Date(unixtime * 1000);
		const options = {
		  day: 'numeric',
		  month: 'long',
		  hour: '2-digit',
		  minute: '2-digit'
		};
		const formatted = date.toLocaleString('ru-RU', options);
		return formatted
	}

  const data = await window.OVKAPI.call("messages.getConversations", {"count": 5, "extended": 1});
  if (!data || !data.items || data.items.length === 0) {
    return `<center style="padding: 95px;">¯\_(ツ)_/¯</center>`;
  }

  let profiles = {};
  if (data.profiles) {
    data.profiles.forEach(profile => {
      profiles[profile.id] = profile;
    });
  } else {
	return `<center style="padding: 95px;">¯\_(ツ)_/¯</center>`;
  }

  let userscsv = Object.keys(profiles).join(',');

  const fullprofiles = Object.values(await window.OVKAPI.call("users.get", {"user_ids": userscsv, "fields": "photo_50"}));

  fullprofiles.forEach(prof => {
    const profile = profiles[prof.id];
    if (profile) {
    	profile.photo_50 = prof.photo_50;
    }
  });

  let html = '';

  for (const item of data.items) {
    const lastMessage = item.last_message;
    const fromId = lastMessage.from_id;
    const peerId = item.conversation.peer.id;
    if (fromId === peerId) {
        const displayName = `${profiles[lastMessage.from_id].first_name} ${profiles[lastMessage.from_id].last_name}`;
        const messageText = lastMessage.text || lastMessage.body || '';
        const formattedDate = formatDate(new Date(lastMessage.date));
        html += `<table border="0" style="font-size: 11px;" class="post">
    <tbody>
        <tr>
            <td width="54" valign="top">
                <a href="/id${fromId}">
                    <img
                        src="${profiles[fromId].photo_50}"
                        width="50"
                        class="post-avatar"
                    />
                </a>
            </td>
            <td width="100%" valign="top">
                <div class="post-author">
                    <a href="/id${fromId}"><b class="post-author-name">${displayName}</b></a>
                </div>
                <div class="post-content">
                    <div class="text">
                        <span class="really_text">${messageText.replace('\n', '<br>')}</span>
                    </div>
                </div>
                <div class="post-menu">
                    <a class="date">${formattedDate}</a>
                    <div style="display: contents;">|</div>
                    <a href="/im?sel=${peerId}">К диалогу</a>
                </div>
            </td>
        </tr>
    </tbody>
</table>`;
    } else {
        const last_messages = await window.OVKAPI.call("messages.getHistory", {"count": 2, "peer_id": peerId});
        const displayName = `${profiles[lastMessage.from_id].first_name} ${profiles[lastMessage.from_id].last_name}`;
        const messageText = lastMessage.text || lastMessage.body || '';
        if (last_messages.items[1].from_id != fromId) {
            const lmitem = last_messages.items[1];
            const replyDisplayName = `${profiles[lmitem.from_id].first_name} ${profiles[lmitem.from_id].last_name}`;
            html += `<table border="0" style="font-size: 11px;" class="post">
    <tbody>
        <tr>
            <td width="54" valign="top">
                <a href="/id${lmitem.from_id}">
                    <img
                        src="${profiles[lmitem.from_id].photo_50}"
                        width="50"
                        class="post-avatar"
                    />
                </a>
            </td>
            <td width="100%" valign="top">
                <div class="post-author">
                    <a href="/id${lmitem.from_id}"><b class="post-author-name">${replyDisplayName}</b></a>
                </div>
                <div class="post-content">
                    <div class="text">
                        <span class="really_text">${lmitem.body.replace('\n', '<br>') || lmitem.text.replace('\n', '<br>') || ''}</span>
                    </div>
                </div>
                <div class="post-menu">
                    <a class="date">${formatDate(new Date(lmitem.date))}</a>
                    <div style="display: contents;">|</div>
                    <a href="/im?sel=${lmitem.from_id}">К диалогу</a>
                </div>
            </td>
        </tr>
    </tbody>
</table>
<div class="im_reply" style="margin-top: -15px;padding: 0 0 10px 0;">
<div class="im_reply_arrow" style="display: inline;"></div>
<table border="0" style="font-size: 11px;" class="post">
    <tbody>
        <tr>
            <td width="54" valign="top">
                <a href="/id8120">
                    <img
                        src="${profiles[fromId].photo_50}"
                        width="50"
                        class="post-avatar"
                    />
                </a>
            </td>
            <td width="100%" valign="top">
                <div class="post-author">
                    <a href="/id${fromId}"><b class="post-author-name">${displayName}</b></a>
                </div>
                <div class="post-content">
                    <div class="text">
                        <span class="really_text">${messageText.replace('\n', '<br>')}</span>
                    </div>
                </div>
                <div class="post-menu">
                    <a class="date">${formatDate(new Date(lastMessage.date))}</a>
                </div>
            </td>
        </tr>
    </tbody>
</table></div>
`;
        } else {
        const formattedDate = formatDate(new Date(lastMessage.date));
        html += `<table border="0" style="font-size: 11px;" class="post">
    <tbody>
        <tr>
            <td width="54" valign="top">
                <a href="/id${fromId}">
                    <img
                        src="${profiles[fromId].photo_50}"
                        width="50"
                        class="post-avatar"
                    />
                </a>
            </td>
            <td width="100%" valign="top">
                <div class="post-author">
                    <a href="/id${fromId}"><b class="post-author-name">${displayName}</b></a>
                </div>
                <div class="post-content">
                    <div class="text">
                        <span class="really_text">${messageText.replace('\n', '<br>')}</span>
                    </div>
                </div>
                <div class="post-menu">
                    <a class="date">${formattedDate}</a>
                    <div style="display: contents;">|</div>
                    <a href="/im?sel=${peerId}">К диалогу</a>
                </div>
            </td>
        </tr>
    </tbody>
</table>`;
        }
}
};

  return html;
}
window.im_cache = false;
    tippy.delegate("body", {target: '.sidebar .navigation .im_pad',
        content: `
<div class="im_pad_head">Личные сообщения</div>
<div class="im_pad_cont">
    <div class="pad_loading"></div>
    <div class="im_pad_scroll"></div>
</div>
<div class="im_pad_footer">
    <input onclick="tippy.hideAll();" value="${tr('close')}" class="button" type="submit">
</div>
`,
        allowHTML: true,
        trigger: 'click',
        interactive: true,
        placement: 'right',
        theme: 'musicpopup',
        arrow: true,
        maxWidth: 627,
        width: 627,
        offset: [0, 10],
        appendTo: document.body,
        popperOptions: {
            strategy: 'fixed'
        },
        onHidden(instance) {
            document.querySelector('.sidebar .navigation a[href="/im"]').classList.remove('pad_shown');
        },
        async onMount(instance) {
            document.querySelector('.sidebar .navigation a[href="/im"]').classList.add('pad_shown');
            if (!im_cache) {
                instance.popper.querySelector('.pad_loading').style = "display: block;";
                instance.popper.querySelector('.im_pad_scroll').style = "display: none;";
                im_cache = await im_padHTML();
                instance.popper.querySelector('.im_pad_scroll').innerHTML = im_cache;
                instance.popper.querySelector('.pad_loading').style = "display: none;";
                instance.popper.querySelector('.im_pad_scroll').style = "display: block;";
                u(instance.popper)
            } else {
                instance.popper.querySelector('.im_pad_scroll').innerHTML = im_cache;
                instance.popper.querySelector('.pad_loading').style = "display: none;";
                instance.popper.querySelector('.im_pad_scroll').style = "display: block;";
            }
        },
       });
})();
