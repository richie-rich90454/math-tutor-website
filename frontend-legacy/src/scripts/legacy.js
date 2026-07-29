(function(){
    var sessionId=null;
    function addMessage(role,content){
        var list=$('#messages-list');
        var row=$('<div class="msg-row msg-row-'+role+'"></div>');
        var bubble=$('<div class="msg-bubble msg-bubble-'+role+'"></div>').text(content);
        row.append(bubble);
        list.append(row);
        $('#messages-area').scrollTop($('#messages-area')[0].scrollHeight);
    }
    function showLoading(){
        $('#loading').show();
    }
    function hideLoading(){
        $('#loading').hide();
    }
    function handleSend(text){
        if (!text||!text.trim()){return}
        $('#welcome').hide();
        $('#chat-view').show();
        addMessage('user',text);
        showLoading();
        $.ajax({
            url:'/api/chat',
            method:'POST',
            contentType:'application/json',
            data:JSON.stringify({
                message:text,
                sessionId:sessionId
            }),
            success:function(resp){
                hideLoading();
                sessionId=resp.sessionId;
                addMessage('assistant',resp.reply);
            },
            error:function(){
                hideLoading();
                addMessage('assistant','Sorry, something went wrong. Please try again.');
            }
        });
    }
    $(document).ready(function(){
        $('#chat-form').on('submit',function(e){
            e.preventDefault();
            var text=$('#message-input').val();
            $('#message-input').val('');
            handleSend(text);
        });
        $('#chat-form-bottom').on('submit',function(e){
            e.preventDefault();
            var text=$('#message-input-bottom').val();
            $('#message-input-bottom').val('');
            handleSend(text);
        });
        $('.prompt-btn,.prompt-btn-accent').on('click',function(){
            var text=$(this).data('text');
            if (text){
                $('#message-input').val(text);
                $('#chat-form').submit();
            }
        });
    });
})();
