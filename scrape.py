from music_db import HAPPY,SAD,ANGER,SURPRISE,CALM
import random

e1, e2, e3, e4, e5 = 0,0,0,0,0
select_group = {
        'starter':[['lover diljit','a catchy beat!']],
        'happy': HAPPY,
        'sad':SAD,
        'angry': ANGER,
        'surprised':SURPRISE,
        'neutral':CALM
    }
group_count = {
        'starter':1,
        'happy': e1,
        'sad':e2,
        'angry': e3,
        'surprised':e4,
        'neutral':e5
    }

def emotion_query(emotion):
    if (group_count[emotion]== len(select_group[emotion])):
        group_count[emotion] = 0
    
    no = group_count[emotion]

    if emotion == 'surprisd':
        no = random.sample(list(range(0,len(select_group[emotion])-1)),1)
        no = no[0]
        print('no = ',no)
    search_query = select_group[emotion][no][0]
    group_count[emotion] += 1

    return search_query, select_group[emotion][no][1]

